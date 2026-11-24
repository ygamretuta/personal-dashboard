import { TIME } from "@/lib/constants";

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

/** "now", "5m", "3h", "2d" for the past; "in 25m", "in 3h" for upcoming events. */
export function formatRelative(iso: string, now: number): string {
  const diff = new Date(iso).getTime() - now;
  const minutes = Math.round(Math.abs(diff) / TIME.MINUTE_MS);
  const hours = Math.round(minutes / MINUTES_PER_HOUR);
  const days = Math.round(hours / HOURS_PER_DAY);

  if (minutes < 1) return "now";
  const text =
    minutes < MINUTES_PER_HOUR ? `${minutes}m` : hours < HOURS_PER_DAY ? `${hours}h` : `${days}d`;
  return diff > 0 ? `in ${text}` : text;
}
