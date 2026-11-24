import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeItem } from "@/features/feed/test-helpers";

const db = vi.hoisted(() => ({
  dailyBrief: { findUnique: vi.fn(), upsert: vi.fn() },
  feedItemRecord: { findMany: vi.fn() },
}));
vi.mock("@/db/client", () => ({ db }));
vi.mock("@/adapters/ai", () => ({ generateJson: vi.fn(), isAiConfigured: () => true }));
vi.mock("@/adapters/monitoring", () => ({ captureError: vi.fn() }));
vi.mock("@/features/feed/server/feed-service", () => ({ fromRecord: (record: unknown) => record }));

import { getDailyBrief } from "./brief-service";

const NOW = new Date("2026-11-24T09:00:00Z");
const options = { timeZone: "UTC", refresh: false, now: NOW };
const AI_JSON = '{"headline":"2 things need you","points":["Slack: deploy"]}';

beforeEach(() => {
  vi.clearAllMocks();
  db.dailyBrief.findUnique.mockResolvedValue(null);
  db.feedItemRecord.findMany.mockResolvedValue([
    makeItem({ priority: "high", title: "Deploy stuck" }),
  ]);
});

describe("daily brief service", () => {
  it("returns today's cached brief without calling the model", async () => {
    db.dailyBrief.findUnique.mockResolvedValue({
      content: AI_JSON,
      generatedAt: new Date("2026-11-24T07:00:00Z"),
    });
    const generate = vi.fn();
    const result = await getDailyBrief("u1", options, { generate, aiConfigured: true });
    expect(result).toMatchObject({ origin: "ai", brief: { headline: "2 things need you" } });
    expect(generate).not.toHaveBeenCalled();
  });

  it("generates once, saves it for the day, and keys it by the viewer's local date", async () => {
    const generate = vi.fn().mockResolvedValue(AI_JSON);
    const result = await getDailyBrief(
      "u1",
      { ...options, timeZone: "America/Los_Angeles" },
      { generate, aiConfigured: true },
    );
    expect(result.origin).toBe("ai");
    expect(db.dailyBrief.upsert).toHaveBeenCalledOnce();
    expect(db.dailyBrief.findUnique.mock.calls[0][0].where.userId_date.date).toEqual(
      new Date("2026-11-24T00:00:00Z"),
    );
    expect(generate.mock.calls[0][0].prompt).toContain("Deploy stuck");
  });

  it("refreshes only after the cooldown", async () => {
    const generate = vi.fn().mockResolvedValue(AI_JSON);
    db.dailyBrief.findUnique.mockResolvedValue({
      content: AI_JSON,
      generatedAt: new Date("2026-11-24T08:55:00Z"),
    });
    await getDailyBrief("u1", { ...options, refresh: true }, { generate, aiConfigured: true });
    expect(generate).not.toHaveBeenCalled();

    db.dailyBrief.findUnique.mockResolvedValue({
      content: AI_JSON,
      generatedAt: new Date("2026-11-24T07:00:00Z"),
    });
    await getDailyBrief("u1", { ...options, refresh: true }, { generate, aiConfigured: true });
    expect(generate).toHaveBeenCalledOnce();
  });

  it("uses the rule-based brief, uncached, when the model fails or returns junk", async () => {
    for (const generate of [
      vi.fn().mockRejectedValue(new Error("boom")),
      vi.fn().mockResolvedValue("not json"),
    ]) {
      const result = await getDailyBrief("u1", options, { generate, aiConfigured: true });
      expect(result.origin).toBe("local");
      expect(result.brief.headline).toBe("1 thing needs you today");
    }
    expect(db.dailyBrief.upsert).not.toHaveBeenCalled();
  });

  it("skips the model for an empty inbox or when no API key is set", async () => {
    const generate = vi.fn();
    db.feedItemRecord.findMany.mockResolvedValue([]);
    expect((await getDailyBrief("u1", options, { generate, aiConfigured: true })).origin).toBe(
      "local",
    );
    db.feedItemRecord.findMany.mockResolvedValue([makeItem()]);
    expect((await getDailyBrief("u1", options, { generate, aiConfigured: false })).origin).toBe(
      "local",
    );
    expect(generate).not.toHaveBeenCalled();
    expect(db.dailyBrief.upsert).not.toHaveBeenCalled();
  });
});
