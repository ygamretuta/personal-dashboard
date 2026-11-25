"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Kbd } from "@/components/ui/kbd";
import { useToast } from "@/components/ui/toast";
import { SHORTCUTS } from "@/features/shortcuts/shortcuts";
import { useKeyboardShortcuts } from "@/features/shortcuts/use-keyboard-shortcuts";
import type { CalendarSource } from "./calendar-source";
import { EventForm, type EventDraft } from "./event-form";
import { useCalendar } from "./use-calendar";
import { WeekGrid } from "./week-grid";
import { addDays } from "./week";

const pad = (value: number) => String(value).padStart(2, "0");
const DEFAULT_HOUR = 9;

function draftAt(day: Date, hour: number): EventDraft {
  return {
    date: `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`,
    startTime: `${pad(hour)}:00`,
    endTime: `${pad(Math.min(hour + 1, 23))}:${hour + 1 > 23 ? "59" : "00"}`,
  };
}

const monthLabel = (start: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(addDays(start, 3));

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="px-6 py-3 text-sm text-muted">{children}</p>;
}

export function CalendarApp({ source, demo }: { source: CalendarSource; demo: boolean }) {
  const calendar = useCalendar(source);
  const toast = useToast();
  const [draft, setDraft] = useState<EventDraft>();

  const openForm = (day: Date, hour: number) => setDraft(draftAt(day, hour));
  useKeyboardShortcuts(
    {
      newEvent: () =>
        openForm(new Date(calendar.now), Math.min(new Date(calendar.now).getHours() + 1, 23)),
    },
    !draft,
  );

  const handleCreate = async (event: Parameters<typeof calendar.create>[0]) => {
    await calendar.create(event);
    toast.show(demo ? "Event added (demo only, nothing is saved)" : "Added to Google Calendar");
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <h1 className="mr-2 text-sm font-semibold">{demo ? "Calendar · demo" : "Calendar"}</h1>
        <button type="button" className="btn" onClick={calendar.today}>
          Today
        </button>
        <button
          type="button"
          className="btn"
          aria-label="Previous week"
          onClick={calendar.previousWeek}
        >
          <ChevronLeft size={14} aria-hidden />
        </button>
        <button type="button" className="btn" aria-label="Next week" onClick={calendar.nextWeek}>
          <ChevronRight size={14} aria-hidden />
        </button>
        <p className="text-sm">{monthLabel(calendar.weekStart)}</p>
        <button
          type="button"
          className="btn btn-primary ml-auto"
          onClick={() => openForm(new Date(calendar.now), DEFAULT_HOUR)}
        >
          <Plus size={14} aria-hidden /> New event <Kbd keys={SHORTCUTS.newEvent.keys} />
        </button>
      </header>

      {calendar.problem && (
        <Notice>
          {calendar.problem.reason === "not_connected"
            ? "Google Calendar isn't connected yet. "
            : "Google needs your permission to read and add events. "}
          <a className="underline" href="/api/integrations/gmail/connect">
            {calendar.problem.reason === "not_connected" ? "Connect Google" : "Reconnect Google"}
          </a>
        </Notice>
      )}
      {calendar.failed && (
        <Notice>
          Couldn&apos;t load your calendar.{" "}
          <button type="button" className="underline" onClick={calendar.retry}>
            Try again
          </button>
        </Notice>
      )}
      {calendar.loading && !calendar.problem && <Notice>Loading…</Notice>}

      <WeekGrid
        weekStart={calendar.weekStart}
        entries={calendar.entries ?? []}
        now={calendar.now}
        onSlotClick={openForm}
      />

      {draft && (
        <EventForm initial={draft} onSubmit={handleCreate} onClose={() => setDraft(undefined)} />
      )}
    </div>
  );
}
