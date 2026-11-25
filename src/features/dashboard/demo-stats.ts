import { dayKey } from "@/features/calendar/week";
import { HOURS_PER_DAY, STATS_WINDOW_DAYS, type Stats } from "@/features/stats/summarize";

const DAILY_COUNTS = [4, 7, 5, 9, 6, 1, 0, 5, 8, 6, 10, 7, 9, 6];
const DEMO_STREAK_DAYS = 8;
const DEMO_MEDIAN_MS = 38 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = 7;

/** A believable fortnight of triage for the demo: busy mornings, a quiet weekend. */
export function demoStats(now: Date): Stats {
  const perDay = DAILY_COUNTS.map((count, index) => ({
    day: dayKey(new Date(now.getTime() - (STATS_WINDOW_DAYS - 1 - index) * DAY_MS)),
    count,
  }));
  const heatmap = Array.from({ length: WEEKDAYS }, (_, weekday) =>
    Array.from({ length: HOURS_PER_DAY }, (_, hour) => {
      const weekendDamping = weekday >= 5 ? 0.15 : 1;
      const morning = Math.max(0, 6 - Math.abs(hour - 9.5) * 2.2);
      const afternoon = Math.max(0, 3.5 - Math.abs(hour - 15) * 1.6);
      return Math.round((morning + afternoon) * weekendDamping);
    }),
  );
  return {
    total: perDay.reduce((sum, day) => sum + day.count, 0),
    perDay,
    bySource: { gmail: 34, slack: 26, github: 15, calendar: 9, vercel: 4 },
    byAction: { archive: 41, markRead: 24, snooze: 13, reply: 10 },
    medianResponseMs: DEMO_MEDIAN_MS,
    streakDays: DEMO_STREAK_DAYS,
    heatmap,
  };
}
