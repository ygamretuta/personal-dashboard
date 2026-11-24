import { TIME } from "@/lib/constants";
import { createGoogleClient, type GoogleClient } from "../google/client";
import type { IntegrationAdapter } from "../types";
import { isRelevantEvent, normalizeCalendarEvent } from "./normalize";
import type { CalendarEvent } from "./types";

const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const LOOKBEHIND_MS = 2 * TIME.HOUR_MS;
const LOOKAHEAD_MS = TIME.DAY_MS;
const MAX_EVENTS = 25;

type ClientFactory = (token: string) => GoogleClient;

export function createCalendarAdapter(
  clientFactory: ClientFactory = createGoogleClient,
  now: () => number = Date.now,
): IntegrationAdapter {
  return {
    source: "calendar",

    async fetchItems(account, since) {
      const client = clientFactory(account.accessToken);
      const current = now();
      const { items = [] } = await client.get<{ items?: CalendarEvent[] }>(EVENTS_URL, {
        timeMin: new Date(current - LOOKBEHIND_MS).toISOString(),
        timeMax: new Date(current + LOOKAHEAD_MS).toISOString(),
        singleEvents: true, // expands recurring events into the instances happening today
        orderBy: "startTime",
        maxResults: MAX_EVENTS,
        updatedMin: since?.toISOString(), // later syncs only see events that changed
      });
      return items.filter(isRelevantEvent).map((event) => normalizeCalendarEvent(event, current));
    },

    // Opening a meeting, snoozing and dismissing are local; the calendar is read-only for us.
    async performAction() {},
  };
}

export const calendarAdapter = createCalendarAdapter();
