import type { AccountMap, AdapterMap } from "@/adapters/integrations/types";
import { DEMO_LATENCY_MS } from "@/lib/constants";
import { bySource } from "@/features/feed/by-source";
import { createMockAdapter } from "./mock-adapter";
import { incomingItems, seedItems } from "./seed";

export function createDemoAdapters(
  now: Date = new Date(),
  latencyMs: number = DEMO_LATENCY_MS,
): AdapterMap {
  return bySource((source) =>
    createMockAdapter({
      source,
      seed: seedItems(source, now),
      incoming: incomingItems(source, now),
      latencyMs,
    }),
  );
}

export const DEMO_ACCOUNTS: AccountMap = bySource((source) => ({
  id: `demo-${source}`,
  source,
  externalAccountId: "demo",
  accessToken: "demo",
}));
