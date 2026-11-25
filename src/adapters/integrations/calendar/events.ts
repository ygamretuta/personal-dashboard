import type { CalendarEntry } from "@/features/calendar/types";
import type { NewEvent } from "@/features/calendar/new-event";
import type { GoogleClient } from "../google/client";
import { meetingLink } from "./normalize";
import type { CalendarEvent } from "./types";

const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const MAX_EVENTS = 250;

export function toCalendarEntry(event: CalendarEvent): CalendarEntry {
  const allDay = !event.start.dateTime;
  return {
    id: event.id,
    title: event.summary || "(untitled event)",
    start: event.start.dateTime ?? event.start.date ?? "",
    end: event.end.dateTime ?? event.end.date ?? "",
    allDay,
    location: event.location,
    meetUrl: meetingLink(event),
    url: event.htmlLink,
  };
}

/** Events between two instants, with recurring events expanded into their occurrences. */
export async function listCalendarEntries(
  client: GoogleClient,
  from: Date,
  to: Date,
): Promise<CalendarEntry[]> {
  const { items = [] } = await client.get<{ items?: CalendarEvent[] }>(EVENTS_URL, {
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: MAX_EVENTS,
  });
  return items.filter((event) => event.status !== "cancelled").map(toCalendarEntry);
}

export function buildEventPayload(event: NewEvent, requestId: string) {
  return {
    summary: event.title,
    location: event.location || undefined,
    description: event.description || undefined,
    start: { dateTime: event.start, timeZone: event.timeZone },
    end: { dateTime: event.end, timeZone: event.timeZone },
    attendees: event.guests.length > 0 ? event.guests.map((email) => ({ email })) : undefined,
    conferenceData: event.addMeet
      ? { createRequest: { requestId, conferenceSolutionKey: { type: "hangoutsMeet" } } }
      : undefined,
  };
}

export async function createCalendarEvent(
  client: GoogleClient,
  event: NewEvent,
  requestId: string = crypto.randomUUID(),
): Promise<CalendarEntry> {
  const created = await client.post<CalendarEvent>(
    EVENTS_URL,
    buildEventPayload(event, requestId),
    {
      // Required for Google to create the Meet link.
      conferenceDataVersion: event.addMeet ? 1 : 0,
      // Guests only get an email when the person adding the event listed some.
      sendUpdates: event.guests.length > 0 ? "all" : "none",
    },
  );
  return toCalendarEntry(created);
}
