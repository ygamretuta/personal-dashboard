import { describe, expect, it } from "vitest";
import { formatTimeRange, isRelevantEvent, normalizeCalendarEvent } from "./normalize";
import type { CalendarEvent } from "./types";

const NOW = new Date("2026-11-24T09:00:00Z").getTime();

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "e1",
    summary: "Team standup",
    htmlLink: "https://calendar.google.com/event?eid=e1",
    hangoutLink: "https://meet.google.com/abc-defg-hij",
    organizer: { displayName: "Engineering", email: "eng@acme.example" },
    start: { dateTime: "2026-11-24T09:30:00Z", timeZone: "UTC" },
    end: { dateTime: "2026-11-24T09:45:00Z" },
    updated: "2026-11-20T12:00:00Z",
    ...overrides,
  };
}

describe("Calendar normalizer", () => {
  it("normalizes an event with a meeting link", () => {
    const item = normalizeCalendarEvent(event(), NOW);
    expect(item).toMatchObject({
      id: "calendar:e1",
      source: "calendar",
      kind: "event",
      title: "Team standup",
      sender: { name: "Engineering", handle: "eng@acme.example" },
      url: "https://meet.google.com/abc-defg-hij",
      dueAt: "2026-11-24T09:30:00Z",
      actions: ["open", "snooze", "archive"],
    });
    expect(item.body).toContain("9:30 AM – 9:45 AM UTC");
    expect(item.body).toContain("Join: https://meet.google.com/abc-defg-hij");
  });

  it("falls back to the conference entry point, then the event page", () => {
    const viaConference = event({
      hangoutLink: undefined,
      conferenceData: {
        entryPoints: [{ entryPointType: "video", uri: "https://zoom.example/j/1" }],
      },
    });
    expect(normalizeCalendarEvent(viaConference, NOW).url).toBe("https://zoom.example/j/1");
    expect(normalizeCalendarEvent(event({ hangoutLink: undefined }), NOW).url).toBe(
      "https://calendar.google.com/event?eid=e1",
    );
  });

  it("raises priority as the start time approaches", () => {
    const at = (iso: string) =>
      normalizeCalendarEvent(event({ start: { dateTime: iso } }), NOW).priority;
    expect(at("2026-11-24T09:30:00Z")).toBe("high");
    expect(at("2026-11-24T12:00:00Z")).toBe("normal");
    expect(at("2026-11-24T18:00:00Z")).toBe("low");
  });

  it("includes location and description in the body", () => {
    const item = normalizeCalendarEvent(
      event({ location: "Room 4B", description: "Review empty states" }),
      NOW,
    );
    expect(item.body).toContain("Room 4B");
    expect(item.body).toContain("Review empty states");
  });
});

describe("relevant events", () => {
  it("skips cancelled, all-day and declined events", () => {
    expect(isRelevantEvent(event())).toBe(true);
    expect(isRelevantEvent(event({ status: "cancelled" }))).toBe(false);
    expect(
      isRelevantEvent(event({ start: { date: "2026-11-24" }, end: { date: "2026-11-25" } })),
    ).toBe(false);
    expect(
      isRelevantEvent(event({ attendees: [{ self: true, responseStatus: "declined" }] })),
    ).toBe(false);
    expect(
      isRelevantEvent(event({ attendees: [{ self: false, responseStatus: "declined" }] })),
    ).toBe(true);
  });
});

describe("time range", () => {
  it("formats in the event's own time zone", () => {
    expect(
      formatTimeRange("2026-11-24T14:00:00Z", "2026-11-24T15:00:00Z", "America/New_York"),
    ).toBe("9:00 AM – 10:00 AM EST");
  });
});
