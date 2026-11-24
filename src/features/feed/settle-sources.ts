import { kindOf, type SyncErrorKind } from "./sync-errors";
import { SOURCES, type FeedItem, type Source } from "./types";

export interface SettledFeed {
  items: FeedItem[];
  errors: Partial<Record<Source, SyncErrorKind>>;
}

/** One failing source must not hide the others: keep what loaded and record what did not. */
export function settleSources(results: PromiseSettledResult<FeedItem[]>[]): SettledFeed {
  const feed: SettledFeed = { items: [], errors: {} };
  results.forEach((result, index) => {
    if (result.status === "fulfilled") feed.items.push(...result.value);
    else feed.errors[SOURCES[index]] = kindOf(result.reason);
  });
  return feed;
}

export const allSourcesFailed = (errors: SettledFeed["errors"]) =>
  Object.keys(errors).length === SOURCES.length;
