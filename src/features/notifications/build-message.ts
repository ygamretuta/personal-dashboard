import type { FeedItem } from "@/features/feed/types";
import type { PushMessage } from "@/adapters/push";
import { SOURCE_CONFIG } from "@/features/feed/sources";

const MAX_LISTED = 1;

/** One notification per sync: the item itself when alone, a count when several arrived. */
export function buildMessage(items: FeedItem[], appUrl: string): PushMessage | undefined {
  const [first] = items;
  if (!first) return undefined;
  if (items.length <= MAX_LISTED)
    return {
      title: `${first.sender.name} · ${SOURCE_CONFIG[first.source].label}`,
      body: first.title,
      url: appUrl,
    };
  return {
    title: `${items.length} high-priority items need you`,
    body: [first.title, "…"].join(" "),
    url: appUrl,
  };
}
