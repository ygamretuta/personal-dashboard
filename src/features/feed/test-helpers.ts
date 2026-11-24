import type { FeedItem } from "./types";

export function makeItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: "slack:1",
    source: "slack",
    kind: "message",
    externalId: "1",
    title: "Hello",
    preview: "Hello there",
    body: "Hello there",
    sender: { name: "Priya Nair" },
    url: "https://example.com",
    receivedAt: "2026-11-23T08:00:00Z",
    priority: "normal",
    status: "unread",
    actions: ["reply", "markRead", "snooze", "open"],
    replies: [],
    ...overrides,
  };
}
