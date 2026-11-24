import { formatRelative } from "@/features/feed/format-time";
import { SOURCE_CONFIG } from "@/features/feed/sources";
import type { FeedItem } from "@/features/feed/types";

const MAX_POINTS = 3;

export interface Brief {
  headline: string;
  points: string[];
}

/** Rule-based brief: the demo's content and the live fallback when Claude is unavailable, built from the same visible items. */
export function buildLocalBrief(items: FeedItem[], now: number): Brief {
  const urgent = items.filter((item) => item.priority === "high" && item.status !== "archived");
  const nextEvent = items
    .filter((item) => item.kind === "event" && item.dueAt && new Date(item.dueAt).getTime() > now)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())[0];

  const points = urgent
    .slice(0, MAX_POINTS)
    .map((item) => `${SOURCE_CONFIG[item.source].label}: ${item.title}`);
  if (nextEvent)
    points.push(`Next up: ${nextEvent.title} ${formatRelative(nextEvent.dueAt!, now)}`);

  const count = urgent.length;
  const headline =
    count === 0
      ? "Nothing urgent today"
      : `${count} ${count === 1 ? "thing needs" : "things need"} you today`;
  return { headline, points };
}
