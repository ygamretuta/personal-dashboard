import { useEffect, useRef } from "react";
import type { CalendarEntry } from "./types";
import { dayKey, entriesOnDay, layoutDay, weekDays, MINUTES_PER_DAY } from "./week";

const HOUR_HEIGHT_PX = 48;
const FIRST_VISIBLE_HOUR = 8;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const PX_PER_MINUTE = HOUR_HEIGHT_PX / 60;

interface WeekGridProps {
  weekStart: Date;
  entries: CalendarEntry[];
  now: number;
  /** Called with the clicked day and hour so a new event can start there. */
  onSlotClick: (day: Date, hour: number) => void;
}

const hourLabel = (hour: number) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(new Date(2000, 0, 1, hour));
const timeLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));

function EntryBlock({ placed }: { placed: ReturnType<typeof layoutDay>[number] }) {
  const { entry, startMinute, endMinute, column, columns } = placed;
  const width = 100 / columns;
  const href = entry.meetUrl ?? entry.url;
  const style = {
    top: startMinute * PX_PER_MINUTE,
    height: (endMinute - startMinute) * PX_PER_MINUTE - 2,
    left: `${column * width}%`,
    width: `calc(${width}% - 2px)`,
  };
  const className =
    "absolute overflow-hidden rounded-md border border-primary/40 bg-selected px-1.5 py-0.5 text-xs leading-tight";
  const content = (
    <>
      <span className="font-medium">{entry.title}</span>
      <span className="block text-muted">{timeLabel(entry.start)}</span>
    </>
  );

  // Entries without a link (demo events) are plain blocks, not dead links.
  if (!href)
    return (
      <div style={style} className={className}>
        {content}
      </div>
    );
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      style={style}
      className={`${className} hover:bg-hover`}
    >
      {content}
    </a>
  );
}

export function WeekGrid({ weekStart, entries, now, onSlotClick }: WeekGridProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = FIRST_VISIBLE_HOUR * HOUR_HEIGHT_PX;
  }, []);
  const days = weekDays(weekStart);
  const todayKey = dayKey(new Date(now));
  const nowMinute = new Date(now).getHours() * 60 + new Date(now).getMinutes();

  return (
    <div className="flex min-h-0 flex-1 flex-col" role="grid" aria-label="Week calendar">
      <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-border text-xs">
        <div />
        {days.map((day) => {
          const allDay = entriesOnDay(entries, day, true);
          const isToday = dayKey(day) === todayKey;
          return (
            <div
              key={dayKey(day)}
              role="columnheader"
              className="border-l border-border px-1.5 py-1.5"
            >
              <p className={isToday ? "font-semibold text-primary" : "text-muted"}>
                {new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric" }).format(day)}
              </p>
              {allDay.map((entry) => (
                <p
                  key={entry.id}
                  className="mt-1 truncate rounded bg-selected px-1"
                  title={entry.title}
                >
                  {entry.title}
                </p>
              ))}
            </div>
          );
        })}
      </div>

      <div
        className="grid min-h-0 flex-1 grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] overflow-y-auto"
        ref={scrollerRef}
      >
        <div>
          {HOURS.map((hour) => (
            <div
              key={hour}
              style={{ height: HOUR_HEIGHT_PX }}
              className="pr-2 text-right text-[11px] text-muted"
            >
              {hour === 0 ? "" : hourLabel(hour)}
            </div>
          ))}
        </div>
        {days.map((day) => {
          const placed = layoutDay(entriesOnDay(entries, day, false));
          const isToday = dayKey(day) === todayKey;
          return (
            <div
              key={dayKey(day)}
              role="gridcell"
              aria-label={new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(day)}
              style={{ height: HOUR_HEIGHT_PX * 24 }}
              className="relative border-l border-border"
              onClick={(event) => {
                const top = event.currentTarget.getBoundingClientRect().top;
                onSlotClick(day, Math.floor((event.clientY - top) / HOUR_HEIGHT_PX));
              }}
            >
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  style={{ height: HOUR_HEIGHT_PX }}
                  className="border-b border-border/60"
                />
              ))}
              {placed.map((item) => (
                <EntryBlock key={item.entry.id} placed={item} />
              ))}
              {isToday && (
                <div
                  aria-hidden
                  style={{ top: (nowMinute / MINUTES_PER_DAY) * HOUR_HEIGHT_PX * 24 }}
                  className="pointer-events-none absolute inset-x-0 h-px bg-red-500"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
