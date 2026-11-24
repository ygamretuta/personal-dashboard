"use client";

import { useCallback, useEffect, useState } from "react";
import { ANALYTICS_EVENTS } from "@/adapters/analytics-events";
import { trackEvent } from "@/adapters/analytics";
import { captureError } from "@/adapters/monitoring";
import type { AccountMap, AdapterMap } from "@/adapters/integrations/types";
import { useToast } from "@/components/ui/toast";
import { CLOCK_TICK_MS } from "@/lib/constants";
import { ACTION_CONFIG } from "./actions";
import { applyAction } from "./apply-action";
import { mergeNewItems, replaceItem } from "./merge-items";
import { allSourcesFailed, settleSources, type SettledFeed } from "./settle-sources";
import { SOURCES, type ActionPayload, type ActionType, type FeedItem, type Source } from "./types";

interface UseFeedOptions {
  adapters: AdapterMap;
  accounts: AccountMap;
  syncIntervalMs: number;
}

type LastSynced = Partial<Record<Source, Date>>;

async function fetchAll(
  { adapters, accounts }: UseFeedOptions,
  lastSynced: LastSynced,
): Promise<SettledFeed> {
  const results = await Promise.allSettled(
    SOURCES.map((source) => adapters[source].fetchItems(accounts[source], lastSynced[source])),
  );
  return settleSources(results);
}

export function useFeed(options: UseFeedOptions) {
  const { adapters, accounts, syncIntervalMs } = options;
  const toast = useToast();
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [freshIds, setFreshIds] = useState<string[]>([]);
  const [sourceErrors, setSourceErrors] = useState<SettledFeed["errors"]>({});
  const [loadFailed, setLoadFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Per source, so a source that failed at first load still gets a full fetch next time.
    const lastSynced: LastSynced = {};
    let hasLoaded = false;

    const sync = async () => {
      const startedAt = new Date();
      try {
        const { items: incoming, errors } = await fetchAll(options, lastSynced);
        if (cancelled) return;
        for (const source of SOURCES) if (!errors[source]) lastSynced[source] = startedAt;
        setSourceErrors(errors);
        if (!hasLoaded && allSourcesFailed(errors)) return setLoadFailed(true);

        setLoadFailed(false);
        setItems((current) => {
          const merged = mergeNewItems(current ?? [], incoming);
          if (hasLoaded) setFreshIds(merged.freshIds); // the first load should not animate
          return merged.items;
        });
        hasLoaded = true;
      } catch (error) {
        captureError(error, { area: "feed", action: "sync" });
        if (!cancelled && !hasLoaded) setLoadFailed(true);
      }
    };

    void sync();
    const syncTimer = setInterval(sync, syncIntervalMs);
    const clockTimer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => {
      cancelled = true;
      clearInterval(syncTimer);
      clearInterval(clockTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options are stable for the page's lifetime
  }, [attempt]);

  const retry = useCallback(() => {
    setLoadFailed(false);
    setItems(null);
    setAttempt((count) => count + 1);
  }, []);

  /** Optimistic: update the UI now, call the adapter, roll back with a toast on failure. */
  const act = useCallback(
    async (item: FeedItem, action: ActionType, payload?: ActionPayload) => {
      setItems((current) => replaceItem(current, applyAction(item, action, payload)));
      setNow(Date.now());
      trackEvent(ANALYTICS_EVENTS.ITEM_ACTION_PERFORMED, { action, source: item.source });
      try {
        await adapters[item.source].performAction(accounts[item.source], item, action, payload);
      } catch (error) {
        captureError(error, { area: "feed", action, source: item.source });
        setItems((current) => replaceItem(current, item));
        toast.show(ACTION_CONFIG[action].failureMessage, "error");
      }
    },
    [adapters, accounts, toast],
  );

  return { items, freshIds, sourceErrors, loadFailed, retry, now, act };
}
