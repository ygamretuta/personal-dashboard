/** What the calendar page shows. Raw Google payloads stay inside the calendar adapter. */
export interface CalendarEntry {
  id: string;
  title: string;
  /** ISO instant for timed events; `YYYY-MM-DD` for all-day events. */
  start: string;
  /** Same format as `start`; for all-day events the end date is exclusive. */
  end: string;
  allDay: boolean;
  location?: string;
  meetUrl?: string;
  /** Opens the event in Google Calendar. */
  url?: string;
}
