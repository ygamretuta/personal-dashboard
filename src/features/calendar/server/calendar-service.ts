import { createCalendarEvent, listCalendarEntries } from "@/adapters/integrations/calendar/events";
import { createGoogleClient, GoogleApiError } from "@/adapters/integrations/google/client";
import { getAccount } from "@/features/integrations/server/accounts";
import type { NewEvent } from "../new-event";
import type { CalendarEntry } from "../types";

/** Not connected, or connected before write access was requested, so the user must (re)connect Google. */
export class CalendarAccessError extends Error {
  constructor(readonly reason: "not_connected" | "needs_reconnect") {
    super(reason);
  }
}

const INSUFFICIENT_PERMISSION_STATUS = 403;

async function clientFor(userId: string) {
  const account = await getAccount(userId, "calendar");
  if (!account) throw new CalendarAccessError("not_connected");
  return createGoogleClient(account.accessToken);
}

export async function listEntries(userId: string, from: Date, to: Date): Promise<CalendarEntry[]> {
  return listCalendarEntries(await clientFor(userId), from, to);
}

export async function addEvent(userId: string, event: NewEvent): Promise<CalendarEntry> {
  const client = await clientFor(userId);
  try {
    return await createCalendarEvent(client, event);
  } catch (error) {
    if (error instanceof GoogleApiError && error.status === INSUFFICIENT_PERMISSION_STATUS)
      throw new CalendarAccessError("needs_reconnect");
    throw error;
  }
}
