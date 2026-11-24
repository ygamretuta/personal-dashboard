"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { captureError } from "@/adapters/monitoring";
import type { FeedItem } from "@/features/feed/types";
import { buildLocalBrief, type Brief } from "./build-local-brief";

interface BriefState {
  brief: Brief;
  origin: "ai" | "local";
}

async function fetchBrief(refresh: boolean): Promise<BriefState> {
  const params = new URLSearchParams({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
  if (refresh) params.set("refresh", "1");
  const response = await fetch(`/api/brief?${params}`);
  if (!response.ok) throw new Error(`Brief request failed (${response.status})`);
  return response.json();
}

/**
 * Demo mode: the rule-based brief, always current.
 * Live mode: Claude's brief for the day from /api/brief, requested once the feed has loaded.
 */
export function useBrief(mode: "demo" | "live", items: FeedItem[] | null, now: number) {
  const [remote, setRemote] = useState<BriefState>();
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const feedLoaded = items !== null;

  useEffect(() => {
    if (mode !== "live" || !feedLoaded) return;
    let cancelled = false;
    fetchBrief(false)
      .then((state) => !cancelled && setRemote(state))
      .catch((error) => {
        captureError(error, { area: "brief", action: "load" });
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, feedLoaded]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setRemote(await fetchBrief(true));
    } catch (error) {
      captureError(error, { area: "brief", action: "refresh" });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const local = useMemo(() => buildLocalBrief(items ?? [], now), [items, now]);
  const useRemote = mode === "live" && remote?.origin === "ai";
  return {
    brief: useRemote ? remote.brief : local,
    isAi: useRemote,
    // Until the first answer arrives (or it fails) the card shows a skeleton instead of the rule-based text.
    loading: mode === "live" && ((!remote && !failed) || refreshing),
    refresh: mode === "live" ? refresh : undefined,
  };
}
