import type { CalendarEntry } from "./types";

export const MINUTES_PER_DAY = 24 * 60;
const DAYS_PER_WEEK = 7;
const MIN_VISIBLE_MINUTES = 30;

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

/** Monday 00:00 local time of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const sinceMonday = (start.getDay() + 6) % DAYS_PER_WEEK;
  return addDays(start, -sinceMonday);
}

export const weekDays = (weekStart: Date): Date[] =>
  Array.from({ length: DAYS_PER_WEEK }, (_, index) => addDays(weekStart, index));

export const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** All-day entries are plain dates, so they are read as local days rather than UTC instants. */
const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export function entriesOnDay(
  entries: CalendarEntry[],
  day: Date,
  allDay: boolean,
): CalendarEntry[] {
  const key = dayKey(day);
  return entries.filter((entry) => {
    if (entry.allDay !== allDay) return false;
    if (!allDay) return dayKey(new Date(entry.start)) === key;
    const first = parseLocalDate(entry.start);
    const lastExclusive = parseLocalDate(entry.end);
    return day >= first && day < lastExclusive;
  });
}

export interface PlacedEntry {
  entry: CalendarEntry;
  startMinute: number;
  endMinute: number;
  /** Side-by-side lane within a group of overlapping events. */
  column: number;
  columns: number;
}

const minuteOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();

/** Positions a day's timed entries; overlapping ones share the width in lanes. */
export function layoutDay(entries: CalendarEntry[]): PlacedEntry[] {
  const items = entries
    .map((entry) => {
      const start = new Date(entry.start);
      const end = new Date(entry.end);
      const startMinute = minuteOfDay(start);
      // An event running past midnight is cut at the end of its first day.
      const sameDay = dayKey(start) === dayKey(end);
      const endMinute = sameDay ? minuteOfDay(end) : MINUTES_PER_DAY;
      return {
        entry,
        startMinute,
        endMinute: Math.max(endMinute, startMinute + MIN_VISIBLE_MINUTES),
        column: 0,
        columns: 1,
      };
    })
    .sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute);

  let group: PlacedEntry[] = [];
  let laneEnds: number[] = [];
  let groupEnd = 0;
  const closeGroup = () => {
    for (const placed of group) placed.columns = laneEnds.length;
    group = [];
    laneEnds = [];
  };

  for (const item of items) {
    if (item.startMinute >= groupEnd) closeGroup();
    const free = laneEnds.findIndex((end) => end <= item.startMinute);
    item.column = free === -1 ? laneEnds.length : free;
    laneEnds[item.column] = item.endMinute;
    groupEnd = group.length === 0 ? item.endMinute : Math.max(groupEnd, item.endMinute);
    group.push(item);
  }
  closeGroup();
  return items;
}
