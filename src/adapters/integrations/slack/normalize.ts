import { PREVIEW_MAX_CHARS } from "@/lib/constants";
import type { FeedItem } from "@/features/feed/types";
import type { SlackRawMessage } from "./types";

const SEPARATOR = ":";

export interface SlackMessageContext {
  channelId: string;
  channelName?: string;
  sender: { name: string; avatarUrl?: string; handle?: string };
}

/** Direct-message channel ids start with "D". */
export const isDirectChannel = (channelId: string) => channelId.startsWith("D");

/** `channel:ts` or `channel:ts:threadTs` when the message is a reply inside a thread. */
export function buildExternalId(channelId: string, ts: string, threadTs?: string): string {
  const parts = [channelId, ts];
  if (threadTs && threadTs !== ts) parts.push(threadTs);
  return parts.join(SEPARATOR);
}

export function parseExternalId(externalId: string): {
  channelId: string;
  ts: string;
  threadTs?: string;
} {
  const [channelId, ts, threadTs] = externalId.split(SEPARATOR);
  if (!channelId || !ts) throw new Error(`Invalid Slack item id: ${externalId}`);
  return { channelId, ts, threadTs };
}

/** Turns Slack's mrkdwn (`<@U1>`, `<url|label>`, entities) into plain text. */
export function cleanSlackText(text: string, userNames: Record<string, string> = {}): string {
  return text
    .replace(
      /<@([A-Z0-9]+)(?:\|([^>]+))?>/g,
      (_, id: string, label?: string) => `@${label ?? userNames[id] ?? "someone"}`,
    )
    .replace(/<#[A-Z0-9]+\|([^>]+)>/g, "#$1")
    .replace(/<([^>|]+)\|([^>]+)>/g, "$2")
    .replace(/<([^>]+)>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function normalizeSlackMessage(
  raw: SlackRawMessage,
  { channelId, channelName, sender }: SlackMessageContext,
  userNames: Record<string, string> = {},
): FeedItem {
  const isDirect = isDirectChannel(channelId);
  const body = cleanSlackText(raw.text ?? "", userNames).trim();
  const externalId = buildExternalId(channelId, raw.ts, raw.thread_ts);

  return {
    id: `slack:${externalId}`,
    source: "slack",
    kind: "message",
    externalId,
    title: isDirect
      ? `${sender.name} in a direct message`
      : `${sender.name} mentioned you in #${channelName ?? "a channel"}`,
    preview: body.replace(/\s+/g, " ").slice(0, PREVIEW_MAX_CHARS),
    body,
    sender,
    url: `https://slack.com/app_redirect?channel=${channelId}&message_ts=${raw.ts}`,
    receivedAt: new Date(Number(raw.ts) * 1000).toISOString(),
    priority: isDirect ? "high" : "normal",
    status: "unread",
    actions: ["reply", "markRead", "snooze", "open"],
    replies: [],
  };
}
