import { describe, expect, it } from "vitest";
import type { CalendarEntry } from "./types";
import { entriesOnDay, layoutDay, startOfWeek, weekDays } from "./week";

const timed = (id: string, start: string, end: string): CalendarEntry => ({
  id,
  title: id,
  start: new Date(start).toISOString(),
  end: new Date(end).toISOString(),
  allDay: false,
});

describe("week helpers", () => {
  it("starts the week on Monday", () => {
    const wednesday = new Date(2026, 10, 25, 15, 30);
    const start = startOfWeek(wednesday);
    expect([start.getDay(), start.getDate(), start.getHours()]).toEqual([1, 23, 0]);
    expect(startOfWeek(new Date(2026, 10, 29)).getDate()).toBe(23); // Sunday belongs to the week before
  });

  it("lists seven consecutive days", () => {
    const days = weekDays(new Date(2026, 10, 23));
    expect(days).toHaveLength(7);
    expect(days[6].getDate()).toBe(29);
  });

  it("puts timed entries on their local day", () => {
    const entries = [timed("a", "2026-11-25T09:00", "2026-11-25T10:00")];
    expect(entriesOnDay(entries, new Date(2026, 10, 25), false)).toHaveLength(1);
    expect(entriesOnDay(entries, new Date(2026, 10, 26), false)).toHaveLength(0);
  });

  it("spreads a multi-day all-day entry over each of its days, excluding the end date", () => {
    const entries: CalendarEntry[] = [
      { id: "trip", title: "Trip", start: "2026-11-25", end: "2026-11-27", allDay: true },
    ];
    expect(entriesOnDay(entries, new Date(2026, 10, 25), true)).toHaveLength(1);
    expect(entriesOnDay(entries, new Date(2026, 10, 26), true)).toHaveLength(1);
    expect(entriesOnDay(entries, new Date(2026, 10, 27), true)).toHaveLength(0);
  });
});

describe("layoutDay", () => {
  it("gives a lone event the full width", () => {
    const [only] = layoutDay([timed("a", "2026-11-25T09:00", "2026-11-25T10:00")]);
    expect([only.column, only.columns, only.startMinute, only.endMinute]).toEqual([0, 1, 540, 600]);
  });

  it("puts overlapping events side by side", () => {
    const placed = layoutDay([
      timed("a", "2026-11-25T09:00", "2026-11-25T10:00"),
      timed("b", "2026-11-25T09:30", "2026-11-25T10:30"),
    ]);
    expect(placed.map((p) => [p.entry.id, p.column, p.columns])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
    ]);
  });

  it("reuses a lane once an earlier event has ended, and keeps separate groups apart", () => {
    const placed = layoutDay([
      timed("a", "2026-11-25T09:00", "2026-11-25T10:00"),
      timed("b", "2026-11-25T09:30", "2026-11-25T10:30"),
      timed("c", "2026-11-25T10:00", "2026-11-25T11:00"),
      timed("d", "2026-11-25T13:00", "2026-11-25T14:00"),
    ]);
    const byId = Object.fromEntries(placed.map((p) => [p.entry.id, [p.column, p.columns]]));
    expect(byId).toEqual({ a: [0, 2], b: [1, 2], c: [0, 2], d: [0, 1] });
  });

  it("gives very short events a readable height and cuts overnight events at midnight", () => {
    const [short, overnight] = layoutDay([
      timed("s", "2026-11-25T09:00", "2026-11-25T09:05"),
      timed("o", "2026-11-25T22:00", "2026-11-26T02:00"),
    ]);
    expect(short.endMinute - short.startMinute).toBe(30);
    expect(overnight.endMinute).toBe(1440);
  });
});
