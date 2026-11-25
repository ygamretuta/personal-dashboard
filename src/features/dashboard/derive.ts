import type { CalendarEntry } from "@/features/calendar/types";
import type { FeedItem, Source } from "@/features/feed/types";
import { bySource } from "@/features/feed/by-source";
import { unreadCounts, visibleItems } from "@/features/feed/visible-items";

const ATTENTION_LIMIT = 5;
const COMMIT_LIMIT = 4;
const DEPLOYMENT_LIMIT = 5;

export const greeting = (hour: number): string =>
  hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

/** The unread items that most deserve a look: high priority first, then newest. */
export function needsAttention(items: FeedItem[], now: number, limit = ATTENTION_LIMIT) {
  return visibleItems(items, "all", now, { unreadOnly: true }).slice(0, limit);
}

export const highPriorityCount = (items: FeedItem[], now: number): number =>
  visibleItems(items, "all", now, { unreadOnly: true }).filter((item) => item.priority === "high")
    .length;

export const unreadBySource = (items: FeedItem[], now: number): Record<Source, number> => {
  const { all, ...perSource } = unreadCounts(items, now);
  void all;
  return perSource;
};

export type AgendaPhase = "past" | "now" | "next" | "later";

export interface AgendaEntry {
  entry: CalendarEntry;
  phase: AgendaPhase;
}

const startOfDay = (ms: number) => {
  const date = new Date(ms);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

/** Today's timed events in order, each marked past, happening now, next up, or later. */
export function todaysAgenda(entries: CalendarEntry[], now: number): AgendaEntry[] {
  const dayStart = startOfDay(now);
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const today = entries
    .filter((entry) => !entry.allDay)
    .filter(
      (entry) =>
        new Date(entry.start).getTime() >= dayStart && new Date(entry.start).getTime() < dayEnd,
    )
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  let nextAssigned = false;
  return today.map((entry) => {
    const start = new Date(entry.start).getTime();
    const end = new Date(entry.end).getTime();
    if (end <= now) return { entry, phase: "past" };
    if (start <= now) return { entry, phase: "now" };
    if (!nextAssigned) {
      nextAssigned = true;
      return { entry, phase: "next" };
    }
    return { entry, phase: "later" };
  });
}

export interface GithubSummary {
  reviewRequests: FeedItem[];
  mentions: number;
  commits: FeedItem[];
}

export function githubSummary(items: FeedItem[], now: number): GithubSummary {
  const github = items.filter((item) => item.source === "github" && item.status !== "archived");
  const unread = visibleItems(github, "all", now, { unreadOnly: true });
  return {
    reviewRequests: unread.filter((item) => item.kind === "review_request"),
    mentions: unread.filter((item) => item.kind === "issue").length,
    commits: github
      .filter((item) => item.kind === "commit")
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
      .slice(0, COMMIT_LIMIT),
  };
}

/** Only failed deployments are ever unread or above low priority; successes arrive read and low. */
export const isFailedDeployment = (item: FeedItem): boolean => item.priority !== "low";

export function recentDeployments(items: FeedItem[]): FeedItem[] {
  return items
    .filter((item) => item.kind === "deployment" && item.status !== "archived")
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, DEPLOYMENT_LIMIT);
}

export const sourceTotals = (items: FeedItem[]) =>
  bySource((source) => items.filter((item) => item.source === source).length);
