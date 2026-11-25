"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarAccessProblem,
  createDemoCalendar,
  createRemoteCalendar,
} from "@/features/calendar/calendar-source";
import { useBrief } from "@/features/brief/use-brief";
import { useFeed } from "@/features/feed/use-feed";
import { MODE_CONFIG, type InboxMode } from "@/features/inbox/use-inbox";
import {
  errorSummary,
  githubSummary,
  highPriorityCount,
  needsAttention,
  recentDeployments,
  todaysAgenda,
  unreadBySource,
} from "./derive";
import type { AgendaState } from "./widgets/agenda-widget";

const CALENDAR_REFRESH_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type CalendarResult =
  | { slot: number; entries: Parameters<typeof todaysAgenda>[0] }
  | { slot: number; reason: "not_connected" | "needs_reconnect" | "failed" };

/** Everything the dashboard shows, from the same sources as the inbox so the numbers always agree. */
export function useDashboard(mode: InboxMode) {
  const { createAdapters, accounts, syncIntervalMs } = MODE_CONFIG[mode];
  const [adapters] = useState(createAdapters);
  const feed = useFeed({ adapters, accounts, syncIntervalMs });
  const brief = useBrief(mode, feed.items, feed.now);

  const [calendar] = useState(() =>
    mode === "demo" ? createDemoCalendar() : createRemoteCalendar(),
  );
  const [result, setResult] = useState<CalendarResult>();
  const slot = Math.floor(feed.now / CALENDAR_REFRESH_MS);

  useEffect(() => {
    let cancelled = false;
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0));
    calendar
      .list(dayStart, new Date(dayStart.getTime() + DAY_MS))
      .then((entries) => !cancelled && setResult({ slot, entries }))
      .catch((error: unknown) => {
        if (cancelled) return;
        const reason = error instanceof CalendarAccessProblem ? error.reason : "failed";
        setResult({ slot, reason });
      });
    return () => {
      cancelled = true;
    };
  }, [calendar, slot]);

  const agendaState: AgendaState = useMemo(() => {
    if (!result) return { status: "loading" };
    if ("entries" in result)
      return { status: "ready", agenda: todaysAgenda(result.entries, feed.now) };
    return { status: "unavailable", reason: result.reason };
  }, [result, feed.now]);

  const { items, now } = feed;
  return {
    now,
    brief,
    agendaState,
    loaded: items !== null,
    sourceErrors: feed.sourceErrors,
    unreadTotal: items
      ? Object.values(unreadBySource(items, now)).reduce((sum, count) => sum + count, 0)
      : 0,
    unreadPerSource: items ? unreadBySource(items, now) : null,
    highPriority: items ? highPriorityCount(items, now) : 0,
    attention: items ? needsAttention(items, now) : null,
    github: items ? githubSummary(items, now) : null,
    deployments: items ? recentDeployments(items) : null,
    errors: items ? errorSummary(items, now) : null,
  };
}
