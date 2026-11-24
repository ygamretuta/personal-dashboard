import { describe, expect, it, vi } from "vitest";
import type { ConnectedAccount } from "../types";
import { createSlackAdapter } from "./adapter";
import type { SlackClient } from "./client";
import { normalizeSlackMessage } from "./normalize";

const account: ConnectedAccount = {
  id: "a",
  source: "slack",
  externalAccountId: "T1:USELF",
  accessToken: "xoxp",
};
const NOW = 1_700_000_000;

function fakeClient(responses: Record<string, unknown>) {
  const call = vi.fn(async (method: string) => {
    if (!(method in responses)) throw new Error(`unexpected ${method}`);
    return responses[method];
  });
  return { client: { call } as unknown as SlackClient, call };
}

describe("Slack adapter", () => {
  it("combines direct messages and mentions, skipping your own and system messages", async () => {
    const { client } = fakeClient({
      "users.info": { user: { id: "UP", name: "priya", profile: { display_name: "Priya" } } },
      "conversations.list": { channels: [{ id: "D1" }] },
      "conversations.history": {
        messages: [
          { ts: `${NOW}.1`, user: "UP", text: "ping" },
          { ts: `${NOW}.2`, user: "USELF", text: "my own reply" },
          { ts: `${NOW}.3`, subtype: "channel_join", user: "UP" },
        ],
      },
      "search.messages": {
        messages: {
          matches: [
            {
              ts: `${NOW}.4`,
              user: "UP",
              text: "<@USELF> review?",
              channel: { id: "C1", name: "eng" },
            },
          ],
        },
      },
    });
    const items = await createSlackAdapter(() => client).fetchItems(
      account,
      new Date((NOW - 10) * 1000),
    );
    expect(items.map((item) => item.id).sort()).toEqual([`slack:C1:${NOW}.4`, `slack:D1:${NOW}.1`]);
    expect(items.find((item) => item.id.includes("D1"))?.sender.name).toBe("Priya");
  });

  it("replies in a thread for channel messages and inline for DMs", async () => {
    const { client, call } = fakeClient({ "chat.postMessage": {} });
    const adapter = createSlackAdapter(() => client);
    const channelItem = normalizeSlackMessage(
      { ts: "5.0", text: "x" },
      { channelId: "C1", channelName: "eng", sender: { name: "A" } },
    );
    const dmItem = normalizeSlackMessage(
      { ts: "6.0", text: "x" },
      { channelId: "D1", sender: { name: "A" } },
    );

    await adapter.performAction(account, channelItem, "reply", { text: "On it" });
    await adapter.performAction(account, dmItem, "reply", { text: "On it" });

    expect(call).toHaveBeenNthCalledWith(1, "chat.postMessage", {
      channel: "C1",
      text: "On it",
      thread_ts: "5.0",
    });
    expect(call).toHaveBeenNthCalledWith(2, "chat.postMessage", {
      channel: "D1",
      text: "On it",
      thread_ts: undefined,
    });
  });

  it("marks a conversation read up to the message", async () => {
    const { client, call } = fakeClient({ "conversations.mark": {} });
    const item = normalizeSlackMessage(
      { ts: "5.0", text: "x" },
      { channelId: "D1", sender: { name: "A" } },
    );
    await createSlackAdapter(() => client).performAction(account, item, "markRead");
    expect(call).toHaveBeenCalledWith("conversations.mark", { channel: "D1", ts: "5.0" });
  });

  it("does not call Slack for local-only actions", async () => {
    const { client, call } = fakeClient({});
    const item = normalizeSlackMessage(
      { ts: "5.0", text: "x" },
      { channelId: "D1", sender: { name: "A" } },
    );
    const adapter = createSlackAdapter(() => client);
    for (const action of ["archive", "snooze", "open"] as const)
      await adapter.performAction(account, item, action);
    expect(call).not.toHaveBeenCalled();
  });

  it("refuses an empty reply", async () => {
    const { client } = fakeClient({});
    const item = normalizeSlackMessage(
      { ts: "5.0", text: "x" },
      { channelId: "D1", sender: { name: "A" } },
    );
    await expect(
      createSlackAdapter(() => client).performAction(account, item, "reply", { text: " " }),
    ).rejects.toThrow();
  });

  it("turns a DM event into an item but ignores other chatter", async () => {
    const { client } = fakeClient({ "users.info": { user: { id: "UP", name: "priya" } } });
    const adapter = createSlackAdapter(() => client);
    const dm = {
      type: "message",
      channel: "D1",
      channel_type: "im",
      user: "UP",
      text: "hi",
      ts: "9.0",
    };
    expect(await adapter.itemFromEvent(account, dm)).toMatchObject({ id: "slack:D1:9.0" });
    expect(
      await adapter.itemFromEvent(account, { ...dm, channel: "C1", channel_type: "channel" }),
    ).toBeNull();
    expect(await adapter.itemFromEvent(account, { ...dm, user: "USELF" })).toBeNull();
  });
});
