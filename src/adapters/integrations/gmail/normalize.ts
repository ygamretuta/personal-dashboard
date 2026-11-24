import { PREVIEW_MAX_CHARS } from "@/lib/constants";
import type { FeedItem, Priority } from "@/features/feed/types";
import type { GmailHeader, GmailMessage, GmailPart, GmailThread } from "./types";

const MAX_BODY_CHARS = 20_000;
const NO_SUBJECT = "(no subject)";

const LABEL_PRIORITY: Record<string, Priority> = {
  IMPORTANT: "high",
  CATEGORY_PROMOTIONS: "low",
  CATEGORY_SOCIAL: "low",
  CATEGORY_FORUMS: "low",
  CATEGORY_UPDATES: "low",
};

export function header(headers: GmailHeader[], name: string): string | undefined {
  return headers.find((entry) => entry.name.toLowerCase() === name.toLowerCase())?.value;
}

/** Parses `"Dana W" <dana@x.com>` or a bare address. */
export function parseAddress(value = ""): { name: string; email: string } {
  const match = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim() || match[2], email: match[2] };
  return { name: value.trim() || "Unknown sender", email: value.trim() };
}

const decodeBase64Url = (data: string) => Buffer.from(data, "base64url").toString("utf8");

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function htmlToText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>|<\/(p|div|tr|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (entity) => HTML_ENTITIES[entity] ?? entity)
    .replace(/\n{3,}/g, "\n\n");
}

function findPart(part: GmailPart, mimeType: string): GmailPart | undefined {
  if (part.mimeType === mimeType && part.body?.data) return part;
  for (const child of part.parts ?? []) {
    const found = findPart(child, mimeType);
    if (found) return found;
  }
  return undefined;
}

/** Prefers text/plain, falls back to stripped HTML, and drops the quoted earlier conversation. */
export function extractBody(payload: GmailPart): string {
  const plain = findPart(payload, "text/plain");
  const html = plain ? undefined : findPart(payload, "text/html");
  const raw = plain
    ? decodeBase64Url(plain.body!.data!)
    : html
      ? htmlToText(decodeBase64Url(html.body!.data!))
      : "";
  const withoutQuote = raw.split(/^On .+ wrote:\s*$/m)[0];
  return withoutQuote.replace(/\r\n/g, "\n").trim().slice(0, MAX_BODY_CHARS);
}

const isUnread = (message: GmailMessage) => message.labelIds?.includes("UNREAD") ?? false;

function priorityOf(labels: string[] = []): Priority {
  if (labels.includes("IMPORTANT")) return "high";
  return labels.map((label) => LABEL_PRIORITY[label]).find(Boolean) ?? "normal";
}

/** One feed item per thread, represented by its newest unread message. */
export function normalizeGmailThread(thread: GmailThread): FeedItem {
  const message = thread.messages.filter(isUnread).at(-1) ?? thread.messages.at(-1)!;
  const headers = message.payload.headers;
  const sender = parseAddress(header(headers, "From"));
  const body = extractBody(message.payload);

  return {
    id: `gmail:${thread.id}`,
    source: "gmail",
    kind: "email",
    externalId: thread.id,
    title: header(headers, "Subject") || NO_SUBJECT,
    preview: body.replace(/\s+/g, " ").slice(0, PREVIEW_MAX_CHARS),
    body,
    sender: { name: sender.name, handle: sender.email },
    url: `https://mail.google.com/mail/u/0/#inbox/${thread.id}`,
    receivedAt: new Date(Number(message.internalDate)).toISOString(),
    priority: priorityOf(message.labelIds),
    status: isUnread(message) ? "unread" : "read",
    actions: ["reply", "archive", "markRead", "snooze", "open"],
    replies: [],
  };
}

interface ReplyInput {
  to: string;
  subject: string;
  text: string;
  inReplyTo?: string;
  references?: string;
}

const stripLineBreaks = (value: string) => value.replace(/[\r\n]+/g, " ").trim();
const encodeHeaderWord = (value: string) =>
  /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value).toString("base64")}?=`;

/** Builds the base64url RFC 2822 message Gmail's send endpoint expects. Header values cannot inject lines. */
export function buildReplyMessage({
  to,
  subject,
  text,
  inReplyTo,
  references,
}: ReplyInput): string {
  const replySubject = /^re:/i.test(subject) ? subject : `Re: ${subject}`;
  const lines = [
    `To: ${stripLineBreaks(to)}`,
    `Subject: ${encodeHeaderWord(stripLineBreaks(replySubject))}`,
    ...(inReplyTo ? [`In-Reply-To: ${stripLineBreaks(inReplyTo)}`] : []),
    ...(inReplyTo
      ? [`References: ${stripLineBreaks([references, inReplyTo].filter(Boolean).join(" "))}`]
      : []),
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text, "utf8").toString("base64"),
  ];
  return Buffer.from(lines.join("\r\n")).toString("base64url");
}
