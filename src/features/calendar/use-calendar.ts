"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarAccessProblem, type CalendarSource } from "./calendar-source";
import type { NewEvent } from "./new-event";
import type { CalendarEntry } from "./types";
import { addDays, dayKey, startOfWeek } from "./week";

const WEEK_DAYS = 7;
const CLOCK_TICK_MS = 60_000;

type Loaded =
  | { weekKey: string; entries: CalendarEntry[]; problem?: undefined; failed?: undefined }
  | { weekKey: string; entries?: undefined; problem?: CalendarAccessProblem; failed?: boolean };

export function useCalendar(source: CalendarSource) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [loaded, setLoaded] = useState<Loaded>();
  const [reloads, setReloads] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const weekKey = dayKey(weekStart);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const [year, month, day] = weekKey.split("-").map(Number);
    const from = new Date(year, month - 1, day);
    source
      .list(from, addDays(from, WEEK_DAYS))
      .then((entries) => !cancelled && setLoaded({ weekKey, entries }))
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof CalendarAccessProblem) setLoaded({ weekKey, problem: error });
        else setLoaded({ weekKey, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [source, weekKey, reloads]);

  const create = useCallback(
    async (event: NewEvent) => {
      const entry = await source.create(event);
      setLoaded((current) =>
        current?.entries ? { ...current, entries: [...current.entries, entry] } : current,
      );
      setReloads((count) => count + 1); // pick up anything Google changed meanwhile
      return entry;
    },
    [source],
  );

  const current = loaded?.weekKey === weekKey ? loaded : undefined;
  return {
    weekStart,
    now,
    entries: current?.entries,
    loading: !current,
    problem: current?.problem,
    failed: current?.failed ?? false,
    retry: () => setReloads((count) => count + 1),
    previousWeek: () => setWeekStart((start) => addDays(start, -WEEK_DAYS)),
    nextWeek: () => setWeekStart((start) => addDays(start, WEEK_DAYS)),
    today: () => setWeekStart(startOfWeek(new Date())),
    create,
  };
}
