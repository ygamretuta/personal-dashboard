import { describe, expect, it, vi } from "vitest";
import type { ConnectedAccount } from "../types";
import { createGithubAdapter } from "./adapter";
import { GithubApiError, type GithubClient } from "./client";
import { normalizeGithubNotification } from "./normalize";
import type { GithubNotification } from "./types";

const account: ConnectedAccount = {
  id: "a",
  source: "github",
  externalAccountId: "42",
  accessToken: "gho",
};
const NOW = new Date("2026-11-24T09:00:00Z").getTime();

const note = (
  id: string,
  reason: string,
  extra: Partial<GithubNotification> = {},
): GithubNotification => ({
  id,
  reason,
  unread: true,
  updated_at: "2026-11-24T08:00:00Z",
  subject: {
    title: `Title ${id}`,
    url: `https://api.github.com/repos/a/b/pulls/${id}`,
    latest_comment_url: `https://api.github.com/comments/${id}`,
    type: "PullRequest",
  },
  repository: { full_name: "a/b" },
  ...extra,
});

function fakeClient(
  notifications: GithubNotification[],
  get: (url: string) => unknown = () => ({
    html_url: "https://h",
    user: { login: "u" },
    body: "b",
  }),
) {
  const client = {
    getAll: vi.fn(async () => notifications),
    get: vi.fn(async (url: string) => get(url)),
    send: vi.fn(async () => {}),
  };
  return { client: client as unknown as GithubClient, ...client };
}

describe("GitHub adapter", () => {
  it("keeps unread review requests and mentions, and drops other reasons", async () => {
    const { client, getAll } = fakeClient([
      note("1", "review_requested"),
      note("2", "mention"),
      note("3", "subscribed"),
      note("4", "mention", { unread: false }),
    ]);
    const items = await createGithubAdapter(
      () => client,
      () => NOW,
    ).fetchItems(account);
    expect(items.map((item) => item.id).sort()).toEqual(["github:1", "github:2"]);
    expect(getAll).toHaveBeenCalledWith("/notifications", {
      participating: true,
      since: "2026-11-22T09:00:00.000Z",
    });
  });

  it("only asks for changes since the last sync", async () => {
    const { client, getAll } = fakeClient([]);
    const since = new Date("2026-11-24T08:30:00Z");
    await createGithubAdapter(
      () => client,
      () => NOW,
    ).fetchItems(account, since);
    expect(getAll).toHaveBeenCalledWith("/notifications", {
      participating: true,
      since: since.toISOString(),
    });
  });

  it("loads the pull request for review requests and the latest comment for mentions", async () => {
    const { client, get } = fakeClient([note("1", "review_requested"), note("2", "mention")]);
    await createGithubAdapter(
      () => client,
      () => NOW,
    ).fetchItems(account);
    expect(get.mock.calls.map(([url]) => url).sort()).toEqual([
      "https://api.github.com/comments/2",
      "https://api.github.com/repos/a/b/pulls/1",
      "https://api.github.com/repos/a/b/pulls/2",
    ]);
  });

  it("still returns the item when details are forbidden, but surfaces other errors", async () => {
    const denied = fakeClient([note("1", "review_requested")], () => {
      throw new GithubApiError("u", 404);
    });
    const [item] = await createGithubAdapter(
      () => denied.client,
      () => NOW,
    ).fetchItems(account);
    expect(item.sender.name).toBe("Someone");

    const broken = fakeClient([note("1", "review_requested")], () => {
      throw new GithubApiError("u", 500);
    });
    await expect(
      createGithubAdapter(
        () => broken.client,
        () => NOW,
      ).fetchItems(account),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("marks done with DELETE and read with PATCH", async () => {
    const { client, send } = fakeClient([]);
    const adapter = createGithubAdapter(() => client);
    const item = normalizeGithubNotification(note("9", "review_requested"));
    await adapter.performAction(account, item, "archive");
    await adapter.performAction(account, item, "markRead");
    expect(send).toHaveBeenNthCalledWith(1, "DELETE", "/notifications/threads/9");
    expect(send).toHaveBeenNthCalledWith(2, "PATCH", "/notifications/threads/9");
  });

  it("leaves open and snooze local, and cannot reply", async () => {
    const { client, send } = fakeClient([]);
    const adapter = createGithubAdapter(() => client);
    const item = normalizeGithubNotification(note("9", "review_requested"));
    await adapter.performAction(account, item, "open");
    await adapter.performAction(account, item, "snooze");
    expect(send).not.toHaveBeenCalled();
    await expect(adapter.performAction(account, item, "reply", { text: "hi" })).rejects.toThrow();
  });
});
