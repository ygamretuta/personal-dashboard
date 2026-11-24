import { describe, expect, it, vi } from "vitest";
import type { ConnectedAccount } from "../types";
import type { GoogleClient } from "../google/client";
import { createGmailAdapter } from "./adapter";
import { normalizeGmailThread } from "./normalize";
import type { GmailThread } from "./types";

const account: ConnectedAccount = {
  id: "a",
  source: "gmail",
  externalAccountId: "1",
  accessToken: "tok",
};

const thread: GmailThread = {
  id: "t1",
  messages: [
    {
      id: "m1",
      threadId: "t1",
      labelIds: ["INBOX", "UNREAD"],
      internalDate: "1700000000000",
      payload: {
        mimeType: "text/plain",
        headers: [
          { name: "From", value: "Dana <dana@x.com>" },
          { name: "Reply-To", value: "recruiting@x.com" },
          { name: "Subject", value: "Loop" },
          { name: "Message-ID", value: "<m1@x>" },
        ],
        body: { data: Buffer.from("hello").toString("base64url") },
      },
    },
  ],
};

function fakeClient(
  get: (url: string, params?: Record<string, unknown>) => unknown = () => thread,
) {
  const client = {
    get: vi.fn(async (url: string, params?: Record<string, unknown>) => get(url, params)),
    post: vi.fn(async () => ({})),
  };
  return { client: client as unknown as GoogleClient, ...client };
}

const item = normalizeGmailThread(thread);

describe("Gmail adapter", () => {
  it("lists unread inbox threads and loads each in full", async () => {
    const { client, get } = fakeClient((url) =>
      url.endsWith("/threads") ? { threads: [{ id: "t1" }] } : thread,
    );
    const items = await createGmailAdapter(() => client).fetchItems(account);
    expect(items).toHaveLength(1);
    expect(get.mock.calls[0][1]).toMatchObject({ q: "in:inbox is:unread newer_than:2d" });
    expect(get.mock.calls[1][1]).toMatchObject({ format: "full" });
  });

  it("only asks for newer mail on later syncs", async () => {
    const { client, get } = fakeClient(() => ({}));
    await createGmailAdapter(() => client).fetchItems(account, new Date(1_700_000_000_000));
    expect(get.mock.calls[0][1]).toMatchObject({ q: "in:inbox is:unread after:1700000000" });
  });

  it("archives by removing the INBOX label", async () => {
    const { client, post } = fakeClient();
    await createGmailAdapter(() => client).performAction(account, item, "archive");
    expect(post).toHaveBeenCalledWith(expect.stringContaining("/threads/t1/modify"), {
      removeLabelIds: ["INBOX"],
    });
  });

  it("marks read by removing the UNREAD label", async () => {
    const { client, post } = fakeClient();
    await createGmailAdapter(() => client).performAction(account, item, "markRead");
    expect(post).toHaveBeenCalledWith(expect.stringContaining("/threads/t1/modify"), {
      removeLabelIds: ["UNREAD"],
    });
  });

  it("replies to Reply-To in the same thread, then marks it read", async () => {
    const { client, post } = fakeClient();
    await createGmailAdapter(() => client).performAction(account, item, "reply", {
      text: "Thursday works",
    });
    const [sendUrl, sendBody] = post.mock.calls[0] as unknown as [
      string,
      { raw: string; threadId: string },
    ];
    expect(sendUrl).toContain("/messages/send");
    expect(sendBody.threadId).toBe("t1");
    const mime = Buffer.from(sendBody.raw, "base64url").toString("utf8");
    expect(mime).toContain("To: recruiting@x.com");
    expect(mime).toContain("In-Reply-To: <m1@x>");
    expect(post.mock.calls[1]).toEqual([
      expect.stringContaining("/modify"),
      { removeLabelIds: ["UNREAD"] },
    ]);
  });

  it("refuses an empty reply and leaves local-only actions alone", async () => {
    const { client, post, get } = fakeClient();
    const adapter = createGmailAdapter(() => client);
    await expect(adapter.performAction(account, item, "reply", { text: " " })).rejects.toThrow();
    await adapter.performAction(account, item, "snooze");
    await adapter.performAction(account, item, "open");
    expect(post).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });
});
