import type { FeedItem, Priority, Source, SourceFilter } from "./types";

const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

function isVisible(item: FeedItem, now: number): boolean {
  if (item.status === "archived") return false;
  if (item.status !== "snoozed") return true;
  return !item.snoozedUntil || new Date(item.snoozedUntil).getTime() <= now;
}

function byPriorityThenNewest(a: FeedItem, b: FeedItem): number {
  const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (priorityDiff !== 0) return priorityDiff;
  return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
}

export interface FeedView {
  query?: string;
  unreadOnly?: boolean;
}

/** Every word of the query must appear somewhere in the item, in any order. */
function matchesQuery(item: FeedItem, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [item.title, item.preview, item.sender.name, item.sender.handle]
    .join(" ")
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}

export function visibleItems(
  items: FeedItem[],
  filter: SourceFilter,
  now: number,
  { query = "", unreadOnly = false }: FeedView = {},
): FeedItem[] {
  return items
    .filter(
      (item) =>
        isVisible(item, now) &&
        (filter === "all" || item.source === filter) &&
        (!unreadOnly || item.status === "unread") &&
        matchesQuery(item, query),
    )
    .sort(byPriorityThenNewest);
}

export function unreadCounts(items: FeedItem[], now: number): Record<Source | "all", number> {
  const counts: Record<Source | "all", number> = {
    all: 0,
    slack: 0,
    gmail: 0,
    calendar: 0,
    github: 0,
  };
  for (const item of items) {
    if (!isVisible(item, now) || item.status !== "unread") continue;
    counts.all += 1;
    counts[item.source] += 1;
  }
  return counts;
}
