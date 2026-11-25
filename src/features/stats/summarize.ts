import { TIME } from "@/lib/constants";

export interface LoggedAction {
  source: string;
  action: string;
  itemReceivedAt: Date;
  createdAt: Date;
}

export interface DayCount {
  /** Local-day key, `YYYY-MM-DD`. */
  day: string;
  count: number;
}

export interface Stats {
  total: number;
  perDay: DayCount[];
  bySource: Record<string, number>;
  byAction: Record<string, number>;
  /** Median time from an item arriving to the user acting on it. */
  medianResponseMs: number | undefined;
  /** Consecutive days, ending today or yesterday, with at least one triaged item. */
  streakDays: number;
}

export const STATS_WINDOW_DAYS = 14;

/** Actions that mean "I dealt with this"; opening a link or marking read alone does not count. */
const TRIAGE_ACTIONS = ["archive", "reply", "snooze", "markRead"];

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const median = (values: number[]): number | undefined => {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const tally = (keys: string[]) =>
  keys.reduce<Record<string, number>>((acc, key) => ({ ...acc, [key]: (acc[key] ?? 0) + 1 }), {});

function streakFrom(counts: Map<string, number>, today: Date): number {
  const cursor = new Date(today);
  // Not having triaged yet today doesn't break yesterday's streak.
  if (!counts.get(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (counts.get(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function summarize(logs: LoggedAction[], now: Date): Stats {
  const triaged = logs.filter((log) => TRIAGE_ACTIONS.includes(log.action));
  const counts = new Map<string, number>();
  for (const log of triaged) {
    const key = dayKey(log.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const perDay = Array.from({ length: STATS_WINDOW_DAYS }, (_, index) => {
    const day = new Date(now.getTime() - (STATS_WINDOW_DAYS - 1 - index) * TIME.DAY_MS);
    const key = dayKey(day);
    return { day: key, count: counts.get(key) ?? 0 };
  });

  return {
    total: triaged.length,
    perDay,
    bySource: tally(triaged.map((log) => log.source)),
    byAction: tally(triaged.map((log) => log.action)),
    medianResponseMs: median(
      triaged
        .map((log) => log.createdAt.getTime() - log.itemReceivedAt.getTime())
        .filter((ms) => ms >= 0),
    ),
    streakDays: streakFrom(counts, now),
  };
}
