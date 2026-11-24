import type { ConnectedAccount, IntegrationAdapter } from "../types";
import { createGoogleClient, type GoogleClient } from "../google/client";
import { buildReplyMessage, header, normalizeGmailThread } from "./normalize";
import type { GmailThread } from "./types";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const MAX_THREADS = 20;
const DEFAULT_LOOKBACK_DAYS = 2;
const REPLY_HEADERS = ["From", "Reply-To", "Subject", "Message-ID", "References"];

type ClientFactory = (token: string) => GoogleClient;

const modifyThread = (client: GoogleClient, threadId: string, removeLabelIds: string[]) =>
  client.post(`${GMAIL_API}/threads/${threadId}/modify`, { removeLabelIds });

async function sendReply(client: GoogleClient, threadId: string, text: string): Promise<void> {
  const thread = await client.get<GmailThread>(`${GMAIL_API}/threads/${threadId}`, {
    format: "metadata",
    metadataHeaders: REPLY_HEADERS,
  });
  const last = thread.messages.at(-1);
  if (!last) throw new Error("Thread has no messages to reply to");

  const headers = last.payload.headers;
  const raw = buildReplyMessage({
    to: header(headers, "Reply-To") ?? header(headers, "From") ?? "",
    subject: header(headers, "Subject") ?? "",
    text,
    inReplyTo: header(headers, "Message-ID"),
    references: header(headers, "References"),
  });
  await client.post(`${GMAIL_API}/messages/send`, { raw, threadId });
  await modifyThread(client, threadId, ["UNREAD"]);
}

export function createGmailAdapter(
  clientFactory: ClientFactory = createGoogleClient,
): IntegrationAdapter {
  return {
    source: "gmail",

    async fetchItems(account: ConnectedAccount, since) {
      const client = clientFactory(account.accessToken);
      const window = since
        ? `after:${Math.floor(since.getTime() / 1000)}`
        : `newer_than:${DEFAULT_LOOKBACK_DAYS}d`;
      const { threads = [] } = await client.get<{ threads?: { id: string }[] }>(
        `${GMAIL_API}/threads`,
        {
          q: `in:inbox is:unread ${window}`,
          maxResults: MAX_THREADS,
        },
      );
      const full = await Promise.all(
        threads.map(({ id }) =>
          client.get<GmailThread>(`${GMAIL_API}/threads/${id}`, { format: "full" }),
        ),
      );
      return full.map(normalizeGmailThread);
    },

    async performAction(account, item, action, payload) {
      const client = clientFactory(account.accessToken);
      const threadId = item.externalId;

      if (action === "reply") {
        const text = payload?.text?.trim();
        if (!text) throw new Error("A reply needs some text");
        return sendReply(client, threadId, text);
      }
      if (action === "archive") await modifyThread(client, threadId, ["INBOX"]);
      if (action === "markRead") await modifyThread(client, threadId, ["UNREAD"]);
      // open and snooze are local to the app; Gmail has nothing to update.
    },
  };
}

export const gmailAdapter = createGmailAdapter();
