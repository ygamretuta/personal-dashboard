import { describe, expect, it } from "vitest";
import { applyAction } from "./apply-action";
import { makeItem } from "./test-helpers";

const NOW = new Date("2026-11-23T09:00:00Z");

describe("applying an action to a feed item", () => {
  it("archives the item", () => {
    expect(applyAction(makeItem(), "archive").status).toBe("archived");
  });

  it("marks an unread item as read", () => {
    expect(applyAction(makeItem({ status: "unread" }), "markRead").status).toBe("read");
  });

  it("snoozes until the requested time", () => {
    const until = "2026-11-23T12:00:00Z";
    const result = applyAction(makeItem(), "snooze", { until }, NOW);
    expect(result).toMatchObject({ status: "snoozed", snoozedUntil: until });
  });

  it("snoozes for one hour when no time is given", () => {
    const result = applyAction(makeItem(), "snooze", {}, NOW);
    expect(result.snoozedUntil).toBe("2026-11-23T10:00:00.000Z");
  });

  it("adds a reply and marks the item read", () => {
    const result = applyAction(makeItem(), "reply", { text: " On it. " }, NOW);
    expect(result.status).toBe("read");
    expect(result.replies).toHaveLength(1);
    expect(result.replies[0].text).toBe("On it.");
  });

  it("ignores an empty reply", () => {
    const item = makeItem();
    expect(applyAction(item, "reply", { text: "  " })).toBe(item);
  });
});
