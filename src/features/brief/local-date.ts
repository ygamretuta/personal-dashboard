/** `YYYY-MM-DD` for `now` in the given IANA time zone; falls back to UTC for an unknown zone. */
export function localDateKey(now: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}
