import { TIME } from "@/lib/constants";

/** "45m", "3h 10m", "2d": the coarsest unit that still says something. */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined) return "—";
  if (ms < TIME.HOUR_MS) return `${Math.max(1, Math.round(ms / TIME.MINUTE_MS))}m`;
  if (ms < TIME.DAY_MS) {
    const hours = Math.floor(ms / TIME.HOUR_MS);
    const minutes = Math.round((ms % TIME.HOUR_MS) / TIME.MINUTE_MS);
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${Math.round(ms / TIME.DAY_MS)}d`;
}
