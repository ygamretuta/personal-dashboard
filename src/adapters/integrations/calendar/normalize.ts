import { PREVIEW_MAX_CHARS, TIME } from "@/lib/constants";
import type { FeedItem, Priority } from "@/features/feed/types";
import type { CalendarEvent } from "./types";

const HIGH_PRIORITY_WITHIN_MS = TIME.HOUR_MS;
const NORMAL_PRIORITY_WITHIN_MS = 4 * TIME.HOUR_MS;
const DEFAULT_TIME_ZONE = "UTC";

/** Timed, confirmed events you have not declined. All-day events are not shown in the inbox. */
export function isRelevantEvent(event: CalendarEvent): boolean {
  if (event.status === "cancelled" || !event.start.dateTime) return false;
  const declined = event.attendees?.some(
    (attendee) => attendee.self && attendee.responseStatus === "declined",
  );
  return !declined;
}

function priorityFor(startMs: number, now: number): Priority {
  const untilStart = startMs - now;
  if (untilStart <= HIGH_PRIORITY_WITHIN_MS) return "high";
  return untilStart <= NORMAL_PRIORITY_WITHIN_MS ? "normal" : "low";
}

export function meetingLink(event: CalendarEvent): string | undefined {
  const video = event.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video",
  );
  return event.hangoutLink ?? video?.uri;
}

export function formatTimeRange(
  startIso: string,
  endIso: string | undefined,
  timeZone: string,
): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  };
  const start = new Intl.DateTimeFormat("en-US", { ...options, timeZoneName: undefined }).format(
    new Date(startIso),
  );
  const end = endIso ? new Intl.DateTimeFormat("en-US", options).format(new Date(endIso)) : "";
  return end ? `${start} – ${end}` : start;
}

export function normalizeCalendarEvent(event: CalendarEvent, now: number): FeedItem {
  const startIso = event.start.dateTime!;
  const timeZone = event.start.timeZone ?? DEFAULT_TIME_ZONE;
  const link = meetingLink(event);
  const organizer = event.organizer?.displayName ?? event.organizer?.email ?? "Calendar";

  const body = [
    formatTimeRange(startIso, event.end.dateTime, timeZone),
    event.location,
    link ? `Join: ${link}` : undefined,
    event.description?.trim() ? `\n${event.description.trim()}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    id: `calendar:${event.id}`,
    source: "calendar",
    kind: "event",
    externalId: event.id,
    title: event.summary || "(untitled event)",
    preview: body.replace(/\s+/g, " ").slice(0, PREVIEW_MAX_CHARS),
    body,
    sender: { name: organizer, handle: event.organizer?.email },
    url: link ?? event.htmlLink,
    receivedAt: event.updated,
    dueAt: startIso,
    priority: priorityFor(new Date(startIso).getTime(), now),
    status: "unread",
    actions: ["open", "snooze", "archive"],
    replies: [],
  };
}
