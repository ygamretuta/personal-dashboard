import { sendPush } from "@/adapters/push";
import { db } from "@/db/client";
import type { FeedItem } from "@/features/feed/types";
import { TIME } from "@/lib/constants";
import { buildMessage } from "../build-message";

/** Items older than this were already seen elsewhere; a first sync must not notify about history. */
const NOTIFY_MAX_AGE_MS = TIME.DAY_MS;

export function worthNotifying(items: FeedItem[], now: number): FeedItem[] {
  return items.filter(
    (item) =>
      item.priority === "high" &&
      item.status === "unread" &&
      now - new Date(item.receivedAt).getTime() < NOTIFY_MAX_AGE_MS,
  );
}

/** Pushes a notification for new high-priority items to every browser the user subscribed. */
export async function notifyNewItems(userId: string, fresh: FeedItem[], appUrl: string) {
  const message = buildMessage(worthNotifying(fresh, Date.now()), appUrl);
  if (!message) return;

  const subscriptions = await db.pushSubscription.findMany({ where: { userId } });
  for (const subscription of subscriptions) {
    const result = await sendPush(subscription, message);
    if (result === "gone") await db.pushSubscription.delete({ where: { id: subscription.id } });
  }
}
