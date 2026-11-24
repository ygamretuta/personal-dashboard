/** Raw Google Calendar payloads. These never leave `adapters/integrations/calendar`. */
export interface CalendarDateTime {
  dateTime?: string; // absent for all-day events, which carry `date` instead
  date?: string;
  timeZone?: string;
}

export interface CalendarEvent {
  id: string;
  status?: "confirmed" | "tentative" | "cancelled";
  summary?: string;
  description?: string;
  location?: string;
  htmlLink: string;
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
  organizer?: { displayName?: string; email?: string };
  attendees?: { self?: boolean; responseStatus?: string }[];
  start: CalendarDateTime;
  end: CalendarDateTime;
  updated: string;
}
