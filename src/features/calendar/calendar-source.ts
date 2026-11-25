import type { NewEvent } from "./new-event";
import type { CalendarEntry } from "./types";
import { addDays, startOfWeek } from "./week";

/** Why the calendar can't be read or written; both are fixed by (re)connecting Google. */
export class CalendarAccessProblem extends Error {
  constructor(readonly reason: "not_connected" | "needs_reconnect") {
    super(reason);
  }
}

/** The page talks to this, so demo mode and the real Google Calendar are interchangeable. */
export interface CalendarSource {
  list: (from: Date, to: Date) => Promise<CalendarEntry[]>;
  create: (event: NewEvent) => Promise<CalendarEntry>;
}

const ENDPOINT = "/api/calendar/events";

async function readJson<T>(response: Response): Promise<T> {
  if (response.ok) return (await response.json()) as T;
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (
    response.status === 403 &&
    (body.error === "not_connected" || body.error === "needs_reconnect")
  )
    throw new CalendarAccessProblem(body.error);
  throw new Error(body.error ?? `Calendar request failed (${response.status})`);
}

export function createRemoteCalendar(): CalendarSource {
  return {
    async list(from, to) {
      const query = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
      const { entries } = await readJson<{ entries: CalendarEntry[] }>(
        await fetch(`${ENDPOINT}?${query}`),
      );
      return entries;
    },
    async create(event) {
      const { entry } = await readJson<{ entry: CalendarEntry }>(
        await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        }),
      );
      return entry;
    },
  };
}

interface DemoSlot {
  day: number; // 0 = Monday
  hour: number;
  startMinute: number;
  minutes: number; // duration
  title: string;
  location?: string;
  meet?: boolean;
}

const DEMO_SLOTS: DemoSlot[] = [
  { day: 0, hour: 9, startMinute: 0, minutes: 30, title: "Weekly planning", meet: true },
  {
    day: 1,
    hour: 11,
    startMinute: 0,
    minutes: 60,
    title: "Interview loop: platform",
    location: "Room 4B",
  },
  { day: 3, hour: 14, startMinute: 0, minutes: 60, title: "Q4 roadmap review", meet: true },
  { day: 4, hour: 16, startMinute: 0, minutes: 30, title: "Demo Friday" },
];
/** Events placed around "now" so a demo opened at any hour has something past, current and upcoming today. */
const DEMO_TODAY: {
  offsetMinutes: number;
  minutes: number;
  title: string;
  location?: string;
  meet?: boolean;
}[] = [
  { offsetMinutes: -100, minutes: 30, title: "Coffee with Dana" },
  { offsetMinutes: 25, minutes: 15, title: "Team standup", meet: true },
  {
    offsetMinutes: 180,
    minutes: 45,
    title: "Design review: inbox empty states",
    location: "Room 4B",
  },
  { offsetMinutes: 300, minutes: 30, title: "1:1 with Priya", meet: true },
];
const DEMO_LATENCY_MS = 200;
const END_OF_DAY_MINUTES = 23 * 60 + 30;

/** In-memory calendar so visitors can add events without signing in. Nothing is stored. */
export function createDemoCalendar(now: Date = new Date()): CalendarSource {
  const monday = startOfWeek(now);
  const entries: CalendarEntry[] = DEMO_SLOTS.map((slot, index) => {
    const start = addDays(monday, slot.day);
    start.setHours(slot.hour, slot.startMinute, 0, 0);
    const end = new Date(start.getTime() + slot.minutes * 60_000);
    return {
      id: `demo-${index}`,
      title: slot.title,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
      location: slot.location,
      meetUrl: slot.meet ? "https://meet.google.com/demo-demo-demo" : undefined,
    };
  });
  const endOfToday = new Date(now);
  endOfToday.setHours(0, END_OF_DAY_MINUTES, 0, 0);
  DEMO_TODAY.forEach((slot, index) => {
    // Keep late-evening visitors' events on today rather than spilling past midnight.
    const start = new Date(
      Math.min(
        now.getTime() + slot.offsetMinutes * 60_000,
        endOfToday.getTime() - slot.minutes * 60_000,
      ),
    );
    entries.push({
      id: `demo-today-${index}`,
      title: slot.title,
      start: start.toISOString(),
      end: new Date(start.getTime() + slot.minutes * 60_000).toISOString(),
      allDay: false,
      location: slot.location,
      meetUrl: slot.meet ? "https://meet.google.com/demo-demo-demo" : undefined,
    });
  });
  const wait = () => new Promise((resolve) => setTimeout(resolve, DEMO_LATENCY_MS));

  return {
    async list(from, to) {
      await wait();
      return entries.filter((entry) => new Date(entry.start) < to && new Date(entry.end) > from);
    },
    async create(event) {
      await wait();
      const entry: CalendarEntry = {
        id: `demo-new-${entries.length}`,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: false,
        location: event.location || undefined,
        meetUrl: event.addMeet ? "https://meet.google.com/demo-demo-demo" : undefined,
      };
      entries.push(entry);
      return entry;
    },
  };
}
