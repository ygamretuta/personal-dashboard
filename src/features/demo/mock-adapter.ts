import type { IntegrationAdapter } from "@/adapters/integrations/types";
import { applyAction } from "@/features/feed/apply-action";
import type { FeedItem, Source } from "@/features/feed/types";

interface MockAdapterOptions {
  source: Source;
  seed: FeedItem[];
  incoming?: FeedItem[];
  latencyMs: number;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** An in-memory IntegrationAdapter: same contract as the real ones, no network. */
export function createMockAdapter({
  source,
  seed,
  incoming = [],
  latencyMs,
}: MockAdapterOptions): IntegrationAdapter {
  let store = [...seed];
  const queue = [...incoming];

  return {
    source,
    async fetchItems(_account, since) {
      await wait(latencyMs);
      if (!since) return store;
      const next = queue.shift();
      if (!next) return [];
      const arrived = { ...next, receivedAt: new Date().toISOString() };
      store = [arrived, ...store];
      return [arrived];
    },
    async performAction(_account, item, action, payload) {
      await wait(latencyMs);
      store = store.map((stored) =>
        stored.id === item.id ? applyAction(stored, action, payload) : stored,
      );
    },
  };
}
