import { describe, expect, it } from "vitest";
import { makeItem } from "@/features/feed/test-helpers";
import { buildLocalBrief } from "./build-local-brief";

const NOW = new Date("2026-11-23T09:00:00Z").getTime();

describe("daily brief", () => {
  it("counts urgent items and lists them by source", () => {
    const items = [
      makeItem({ id: "a", priority: "high", title: "Deploy stuck" }),
      makeItem({ id: "b" }),
    ];
    const brief = buildLocalBrief(items, NOW);
    expect(brief.headline).toBe("1 thing needs you today");
    expect(brief.points).toContain("Slack: Deploy stuck");
  });

  it("mentions the next upcoming event", () => {
    const event = makeItem({
      id: "e",
      kind: "event",
      source: "calendar",
      title: "Standup",
      dueAt: "2026-11-23T09:25:00Z",
    });
    expect(buildLocalBrief([event], NOW).points).toContain("Next up: Standup in 25m");
  });

  it("says so when nothing is urgent", () => {
    expect(buildLocalBrief([makeItem()], NOW).headline).toBe("Nothing urgent today");
  });
});
