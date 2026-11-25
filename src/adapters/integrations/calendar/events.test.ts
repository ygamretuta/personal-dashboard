import { describe, expect, it, vi } from "vitest";
import type { GoogleClient } from "../google/client";
import { buildEventPayload, createCalendarEvent, listCalendarEntries } from "./events";
import type { CalendarEvent } from "./types";

const base = {
  title: "Design review",
  start: "2026-11-26T09:00:00.000Z",
  end: "2026-11-26T10:00:00.000Z",
  timeZone: "Asia/Manila",
  guests: [],
  addMeet: false,
};

const googleEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: "e1",
  summary: "Design review",
  htmlLink: "https://calendar.google.com/e1",
  start: { dateTime: base.start },
  end: { dateTime: base.end },
  updated: "2026-11-25T00:00:00Z",
  ...overrides,
});

describe("calendar events", () => {
  it("lists events for a range, dropping cancelled ones and marking all-day events", async () => {
    const get = vi.fn().mockResolvedValue({
      items: [
        googleEvent(),
        googleEvent({ id: "gone", status: "cancelled" }),
        googleEvent({ id: "day", start: { date: "2026-11-27" }, end: { date: "2026-11-28" } }),
      ],
    });
    const entries = await listCalendarEntries(
      { get } as unknown as GoogleClient,
      new Date("2026-11-23T00:00:00Z"),
      new Date("2026-11-30T00:00:00Z"),
    );
    expect(entries.map((entry) => [entry.id, entry.allDay])).toEqual([
      ["e1", false],
      ["day", true],
    ]);
    expect(get.mock.calls[0][1]).toMatchObject({
      timeMin: "2026-11-23T00:00:00.000Z",
      singleEvents: true,
    });
  });

  it("builds a plain payload with no guests or Meet request", () => {
    expect(buildEventPayload(base, "req")).toEqual({
      summary: "Design review",
      location: undefined,
      description: undefined,
      start: { dateTime: base.start, timeZone: "Asia/Manila" },
      end: { dateTime: base.end, timeZone: "Asia/Manila" },
      attendees: undefined,
      conferenceData: undefined,
    });
  });

  it("creates the event, requests a Meet link and emails guests when asked", async () => {
    const post = vi
      .fn()
      .mockResolvedValue(googleEvent({ hangoutLink: "https://meet.google.com/x" }));
    const entry = await createCalendarEvent(
      { post } as unknown as GoogleClient,
      { ...base, guests: ["a@b.co"], addMeet: true },
      "req-1",
    );
    const [, body, params] = post.mock.calls[0];
    expect(body.attendees).toEqual([{ email: "a@b.co" }]);
    expect(body.conferenceData.createRequest.requestId).toBe("req-1");
    expect(params).toEqual({ conferenceDataVersion: 1, sendUpdates: "all" });
    expect(entry.meetUrl).toBe("https://meet.google.com/x");
  });

  it("does not email anyone when there are no guests", async () => {
    const post = vi.fn().mockResolvedValue(googleEvent());
    await createCalendarEvent({ post } as unknown as GoogleClient, base);
    expect(post.mock.calls[0][2]).toEqual({ conferenceDataVersion: 0, sendUpdates: "none" });
  });
});
