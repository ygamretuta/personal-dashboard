import { describe, expect, it } from "vitest";
import { makeItem } from "./test-helpers";
import { unreadCounts, visibleItems } from "./visible-items";

const NOW = new Date("2026-11-23T09:00:00Z").getTime();

describe("visible feed items", () => {
  it("puts high priority first, then newest", () => {
    const items = [
      makeItem({ id: "a", priority: "normal", receivedAt: "2026-11-23T08:30:00Z" }),
      makeItem({ id: "b", priority: "high", receivedAt: "2026-11-23T07:00:00Z" }),
      makeItem({ id: "c", priority: "normal", receivedAt: "2026-11-23T08:45:00Z" }),
    ];
    expect(visibleItems(items, "all", NOW).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("hides archived items and items snoozed into the future", () => {
    const items = [
      makeItem({ id: "archived", status: "archived" }),
      makeItem({ id: "later", status: "snoozed", snoozedUntil: "2026-11-23T10:00:00Z" }),
      makeItem({ id: "due", status: "snoozed", snoozedUntil: "2026-11-23T08:00:00Z" }),
    ];
    expect(visibleItems(items, "all", NOW).map((i) => i.id)).toEqual(["due"]);
  });

  it("filters by source", () => {
    const items = [makeItem({ id: "s" }), makeItem({ id: "g", source: "github" })];
    expect(visibleItems(items, "github", NOW).map((i) => i.id)).toEqual(["g"]);
  });

  it("counts unread items per source", () => {
    const items = [
      makeItem({ id: "1" }),
      makeItem({ id: "2", source: "gmail" }),
      makeItem({ id: "3", status: "read" }),
    ];
    expect(unreadCounts(items, NOW)).toMatchObject({ all: 2, slack: 1, gmail: 1, github: 0 });
  });
});
