import { describe, expect, it } from "vitest";
import { summarize, type LoggedAction } from "./summarize";

const NOW = new Date(2026, 10, 25, 12, 0, 0);
const at = (daysAgo: number, hour = 10) => new Date(2026, 10, 25 - daysAgo, hour, 0, 0);

const log = (daysAgo: number, overrides: Partial<LoggedAction> = {}): LoggedAction => ({
  source: "gmail",
  action: "archive",
  itemReceivedAt: at(daysAgo, 8),
  createdAt: at(daysAgo, 10),
  ...overrides,
});

describe("summarize", () => {
  it("counts triage actions per day, source and action", () => {
    const stats = summarize([log(0), log(0, { source: "slack", action: "reply" }), log(1)], NOW);
    expect(stats.total).toBe(3);
    expect(stats.perDay.at(-1)?.count).toBe(2);
    expect(stats.bySource).toEqual({ gmail: 2, slack: 1 });
    expect(stats.byAction).toEqual({ archive: 2, reply: 1 });
  });

  it("ignores actions that are not triage, such as opening a link", () => {
    expect(summarize([log(0, { action: "open" })], NOW).total).toBe(0);
  });

  it("takes the median time between arrival and action", () => {
    const stats = summarize(
      [
        log(0, { itemReceivedAt: at(0, 9) }), // 1h
        log(0, { itemReceivedAt: at(0, 8) }), // 2h
        log(0, { itemReceivedAt: at(0, 5) }), // 5h
      ],
      NOW,
    );
    expect(stats.medianResponseMs).toBe(2 * 60 * 60 * 1000);
  });

  it("has no median without actions", () => {
    expect(summarize([], NOW).medianResponseMs).toBeUndefined();
  });

  it("counts consecutive active days as a streak", () => {
    expect(summarize([log(0), log(1), log(2), log(4)], NOW).streakDays).toBe(3);
  });

  it("keeps yesterday's streak alive before the first action today", () => {
    expect(summarize([log(1), log(2)], NOW).streakDays).toBe(2);
  });

  it("resets the streak after a missed day", () => {
    expect(summarize([log(2), log(3)], NOW).streakDays).toBe(0);
  });
});
