import { SNOOZE_DEFAULT_MS } from "@/lib/constants";
import type { ActionPayload, ActionType, FeedItem } from "./types";

type ActionHandler = (item: FeedItem, payload: ActionPayload, now: Date) => FeedItem;

const ACTION_HANDLERS: Record<ActionType, ActionHandler> = {
  open: (item) => (item.status === "unread" ? { ...item, status: "read" } : item),
  markRead: (item) => ({ ...item, status: "read" }),
  archive: (item) => ({ ...item, status: "archived" }),
  snooze: (item, { until }, now) => ({
    ...item,
    status: "snoozed",
    snoozedUntil: until ?? new Date(now.getTime() + SNOOZE_DEFAULT_MS).toISOString(),
  }),
  reply: (item, { text }, now) => {
    if (!text?.trim()) return item;
    const reply = {
      id: `${item.id}:reply:${item.replies.length + 1}`,
      text: text.trim(),
      sentAt: now.toISOString(),
    };
    return { ...item, status: "read", replies: [...item.replies, reply] };
  },
};

/** Pure state transition shared by optimistic UI updates and the in-memory demo adapters. */
export function applyAction(
  item: FeedItem,
  action: ActionType,
  payload: ActionPayload = {},
  now: Date = new Date(),
): FeedItem {
  return ACTION_HANDLERS[action](item, payload, now);
}
