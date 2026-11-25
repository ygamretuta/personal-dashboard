import { describe, expect, it } from "vitest";
import type { CalendarEntry } from "@/features/calendar/types";
import { makeItem } from "@/features/feed/test-helpers";
import {
  githubSummary,
  greeting,
  highPriorityCount,
  isFailedDeployment,
  needsAttention,
  recentDeployments,
  todaysAgenda,
  unreadBySource,
} from "./derive";

const NOW = new Date(2026, 10, 25, 11, 0).getTime();
const at = (hour: number, minute = 0) => new Date(2026, 10, 25, hour, minute).toISOString();
const event = (id: string, start: string, end: string): CalendarEntry => ({
  id,
  title: id,
  start,
  end,
  allDay: false,
});

describe("greeting", () => {
  it("changes with the time of day", () => {
    expect([greeting(8), greeting(14), greeting(21)]).toEqual([
      "Good morning",
      "Good afternoon",
      "Good evening",
    ]);
  });
});

describe("attention", () => {
  const items = [
    makeItem({ id: "a", priority: "normal", receivedAt: "2026-11-25T02:00:00Z" }),
    makeItem({ id: "b", priority: "high", receivedAt: "2026-11-25T01:00:00Z" }),
    makeItem({ id: "c", priority: "high", status: "read" }),
  ];
  it("lists unread items with high priority first and respects the limit", () => {
    expect(needsAttention(items, NOW).map((i) => i.id)).toEqual(["b", "a"]);
    expect(needsAttention(items, NOW, 1)).toHaveLength(1);
  });
  it("counts unread high-priority items", () => {
    expect(highPriorityCount(items, NOW)).toBe(1);
  });
  it("counts unread per source without the total", () => {
    const counts = unreadBySource([...items, makeItem({ id: "g", source: "github" })], NOW);
    expect(counts).toMatchObject({ slack: 2, github: 1, gmail: 0 });
    expect("all" in counts).toBe(false);
  });
});

describe("todaysAgenda", () => {
  it("orders today's events and marks past, current and next", () => {
    const agenda = todaysAgenda(
      [
        event("late", at(15), at(16)),
        event("now", at(10, 30), at(11, 30)),
        event("past", at(9), at(9, 30)),
        event("next", at(13), at(14)),
        event(
          "tomorrow",
          new Date(2026, 10, 26, 9).toISOString(),
          new Date(2026, 10, 26, 10).toISOString(),
        ),
        { ...event("allday", "2026-11-25", "2026-11-26"), allDay: true },
      ],
      NOW,
    );
    expect(agenda.map((a) => [a.entry.id, a.phase])).toEqual([
      ["past", "past"],
      ["now", "now"],
      ["next", "next"],
      ["late", "later"],
    ]);
  });
});

describe("github and deployments", () => {
  it("separates review requests, mentions and recent commits", () => {
    const summary = githubSummary(
      [
        makeItem({ id: "r", source: "github", kind: "review_request" }),
        makeItem({ id: "m", source: "github", kind: "issue" }),
        makeItem({
          id: "c1",
          source: "github",
          kind: "commit",
          status: "read",
          receivedAt: "2026-11-25T01:00:00Z",
        }),
        makeItem({
          id: "c2",
          source: "github",
          kind: "commit",
          status: "read",
          receivedAt: "2026-11-25T02:00:00Z",
        }),
        makeItem({ id: "x", source: "slack" }),
      ],
      NOW,
    );
    expect(summary.reviewRequests.map((i) => i.id)).toEqual(["r"]);
    expect(summary.mentions).toBe(1);
    expect(summary.commits.map((i) => i.id)).toEqual(["c2", "c1"]);
  });

  it("lists newest deployments and tells failures from successes", () => {
    const failed = makeItem({
      id: "f",
      source: "vercel",
      kind: "deployment",
      priority: "high",
      receivedAt: "2026-11-25T03:00:00Z",
    });
    const ok = makeItem({
      id: "o",
      source: "vercel",
      kind: "deployment",
      priority: "low",
      receivedAt: "2026-11-25T02:00:00Z",
    });
    expect(recentDeployments([ok, failed, makeItem({ id: "n" })]).map((i) => i.id)).toEqual([
      "f",
      "o",
    ]);
    expect([isFailedDeployment(failed), isFailedDeployment(ok)]).toEqual([true, false]);
  });
});

describe("errorSummary", () => {
  it("counts unresolved Sentry issues and picks the most pressing", async () => {
    const { errorSummary } = await import("./derive");
    const summary = errorSummary(
      [
        makeItem({ id: "e1", source: "sentry", kind: "error", priority: "high" }),
        makeItem({ id: "e2", source: "sentry", kind: "error", priority: "normal" }),
        makeItem({ id: "e3", source: "sentry", kind: "error", status: "archived" }),
        makeItem({ id: "x", source: "gmail" }),
      ],
      NOW,
    );
    expect(summary).toMatchObject({ open: 2, critical: 1 });
    expect(summary.top.map((item) => item.id)).toEqual(["e1", "e2"]);
  });
});
