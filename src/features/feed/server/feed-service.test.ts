import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeItem } from "../test-helpers";

const db = vi.hoisted(() => ({
  feedItemRecord: { findMany: vi.fn(), createMany: vi.fn(), update: vi.fn() },
}));
vi.mock("@/db/client", () => ({ db }));

import { storeItems } from "./feed-service";

const stored = (externalId: string, overrides: Record<string, unknown> = {}) => ({
  id: `row-${externalId}`,
  externalId,
  status: "read",
  title: "Old title",
  preview: "old preview",
  priority: "normal",
  snooze: null,
  replies: [],
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe("storeItems", () => {
  it("saves unseen items and reports them as fresh", async () => {
    db.feedItemRecord.findMany.mockResolvedValue([stored("known")]);
    const known = makeItem({
      id: "slack:known",
      externalId: "known",
      title: "Old title",
      preview: "old preview",
    });
    const unseen = makeItem({ id: "slack:new", externalId: "new" });
    const { items, fresh } = await storeItems("u1", "slack", [known, unseen]);

    expect(fresh.map((item) => item.externalId)).toEqual(["new"]);
    expect(db.feedItemRecord.createMany).toHaveBeenCalledOnce();
    expect(items.find((item) => item.externalId === "known")?.status).toBe("read");
    expect(db.feedItemRecord.update).not.toHaveBeenCalled(); // Slack messages do not change
  });

  it("refreshes changed Sentry issues but keeps what the user did with them", async () => {
    db.feedItemRecord.findMany.mockResolvedValue([stored("issue:1", { priority: "normal" })]);
    const grown = makeItem({
      id: "sentry:issue:1",
      source: "sentry",
      externalId: "issue:1",
      title: "TypeError",
      preview: "300 events",
      priority: "high",
    });
    const { items, fresh } = await storeItems("u1", "sentry", [grown]);

    expect(fresh).toEqual([]);
    expect(db.feedItemRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "row-issue:1" },
        data: expect.objectContaining({ preview: "300 events", priority: "high" }),
      }),
    );
    expect(db.feedItemRecord.update.mock.calls[0][0].data).not.toHaveProperty("status");
    expect(items[0]).toMatchObject({ status: "read", priority: "high" });
  });

  it("does not write when a Sentry issue has not changed", async () => {
    db.feedItemRecord.findMany.mockResolvedValue([stored("issue:1")]);
    const same = makeItem({
      source: "sentry",
      externalId: "issue:1",
      title: "Old title",
      preview: "old preview",
      priority: "normal",
    });
    await storeItems("u1", "sentry", [same]);
    expect(db.feedItemRecord.update).not.toHaveBeenCalled();
  });
});
