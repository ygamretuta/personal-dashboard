import { describe, expect, it } from "vitest";
import { createDemoAdapters, DEMO_ACCOUNTS } from "./demo-adapters";
import { SOURCES } from "@/features/feed/types";

const NOW = new Date("2026-11-23T09:00:00Z");

describe("demo adapters", () => {
  it("serve seeded items for every source, normalized to the FeedItem shape", async () => {
    const adapters = createDemoAdapters(NOW, 0);
    for (const source of SOURCES) {
      const items = await adapters[source].fetchItems(DEMO_ACCOUNTS[source]);
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.id).toBe(`${source}:${item.externalId}`);
        expect(item.preview.length).toBeLessThanOrEqual(200);
        expect(item.status).toBe("unread");
      }
    }
  });

  it("remember actions in memory", async () => {
    const { slack } = createDemoAdapters(NOW, 0);
    const [first] = await slack.fetchItems(DEMO_ACCOUNTS.slack);
    await slack.performAction(DEMO_ACCOUNTS.slack, first, "archive");
    const after = await slack.fetchItems(DEMO_ACCOUNTS.slack);
    expect(after.find((item) => item.id === first.id)?.status).toBe("archived");
  });

  it("deliver one incoming item per sync after the first load", async () => {
    const { slack } = createDemoAdapters(NOW, 0);
    await slack.fetchItems(DEMO_ACCOUNTS.slack);
    expect(await slack.fetchItems(DEMO_ACCOUNTS.slack, NOW)).toHaveLength(1);
    expect(await slack.fetchItems(DEMO_ACCOUNTS.slack, NOW)).toHaveLength(0);
  });
});
