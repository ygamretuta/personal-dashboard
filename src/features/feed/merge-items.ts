import type { FeedItem } from "./types";

/** Adds unseen items; existing ones keep local state (optimistic edits win over a stale sync). */
export function mergeNewItems(
  current: FeedItem[],
  incoming: FeedItem[],
): { items: FeedItem[]; freshIds: string[] } {
  const known = new Set(current.map((item) => item.id));
  const fresh = incoming.filter((item) => !known.has(item.id));
  return { items: [...fresh, ...current], freshIds: fresh.map((item) => item.id) };
}

export function replaceItem(items: FeedItem[] | null, replacement: FeedItem): FeedItem[] | null {
  return items && items.map((item) => (item.id === replacement.id ? replacement : item));
}
