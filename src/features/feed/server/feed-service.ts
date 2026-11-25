import { ADAPTERS } from "@/adapters/integrations/registry";
import { db } from "@/db/client";
import type { FeedItemRecord, Snooze } from "@/generated/prisma/client";
import { getAccount, markSynced } from "@/features/integrations/server/accounts";
import { applyAction } from "../apply-action";
import type { ActionPayload, ActionType, FeedItem, FeedReply, Source } from "../types";

type StoredItem = FeedItemRecord & { snooze: Snooze | null };

const toRecordData = (userId: string, item: FeedItem) => ({
  userId,
  source: item.source,
  externalId: item.externalId,
  kind: item.kind,
  title: item.title,
  preview: item.preview,
  body: item.body,
  senderName: item.sender.name,
  senderAvatarUrl: item.sender.avatarUrl,
  senderHandle: item.sender.handle,
  url: item.url,
  receivedAt: new Date(item.receivedAt),
  dueAt: item.dueAt ? new Date(item.dueAt) : undefined,
  priority: item.priority,
});

/** Content comes from the source; what the user did with it (read, archived, snoozed, replies) comes from our DB. */
function withLocalState(item: FeedItem, stored: StoredItem | undefined): FeedItem {
  if (!stored) return item;
  return {
    ...item,
    status: stored.status,
    snoozedUntil: stored.snooze?.until.toISOString(),
    replies: stored.replies as unknown as FeedReply[],
  };
}

export function fromRecord(stored: StoredItem): FeedItem {
  return withLocalState(
    {
      id: `${stored.source}:${stored.externalId}`,
      source: stored.source,
      kind: stored.kind,
      externalId: stored.externalId,
      title: stored.title,
      preview: stored.preview,
      body: stored.body,
      sender: {
        name: stored.senderName,
        avatarUrl: stored.senderAvatarUrl ?? undefined,
        handle: stored.senderHandle ?? undefined,
      },
      url: stored.url,
      receivedAt: stored.receivedAt.toISOString(),
      dueAt: stored.dueAt?.toISOString(),
      priority: stored.priority,
      status: "unread",
      actions: [],
      replies: [],
    },
    stored,
  );
}

export interface StoredFeed {
  /** Every item merged with the user's local state. */
  items: FeedItem[];
  /** Items we had never stored before: what a notification is about. */
  fresh: FeedItem[];
}

/** Sources whose items change after we first see them (an error's event count keeps climbing). */
const REFRESHED_SOURCES: Source[] = ["sentry"];

/** Brings stored copies of changed items up to date; what the user did with them is left alone. */
async function refreshStored(stored: Map<string, StoredItem>, items: FeedItem[]): Promise<void> {
  const changed = items.filter((item) => {
    const record = stored.get(item.externalId);
    return (
      record &&
      (record.preview !== item.preview ||
        record.priority !== item.priority ||
        record.title !== item.title)
    );
  });
  await Promise.all(
    changed.map((item) =>
      db.feedItemRecord.update({
        where: { id: stored.get(item.externalId)!.id },
        data: {
          title: item.title,
          preview: item.preview,
          body: item.body,
          priority: item.priority,
          receivedAt: new Date(item.receivedAt),
        },
      }),
    ),
  );
}

/** Saves newly seen items and returns every item merged with the user's local state. */
export async function storeItems(
  userId: string,
  source: Source,
  items: FeedItem[],
): Promise<StoredFeed> {
  const where = { userId, source, externalId: { in: items.map((item) => item.externalId) } };
  const existing = await db.feedItemRecord.findMany({ where, include: { snooze: true } });
  const known = new Map(existing.map((record) => [record.externalId, record]));

  const fresh = items.filter((item) => !known.has(item.externalId));
  if (fresh.length > 0) {
    await db.feedItemRecord.createMany({
      data: fresh.map((item) => toRecordData(userId, item)),
      skipDuplicates: true,
    });
  }
  if (REFRESHED_SOURCES.includes(source)) await refreshStored(known, items);
  return {
    items: items.map((item) => withLocalState(item, known.get(item.externalId))),
    fresh,
  };
}

/** Pulls a source from its provider and stores it. Shared by the inbox API and the background sync. */
export async function syncSource(
  userId: string,
  source: Source,
  since?: Date,
): Promise<StoredFeed> {
  const adapter = ADAPTERS[source];
  const account = adapter && (await getAccount(userId, source));
  if (!adapter || !account) return { items: [], fresh: [] };

  const items = await adapter.fetchItems(account, since);
  await markSynced(account.id);
  return storeItems(userId, source, items);
}

export async function fetchFeed(userId: string, source: Source, since?: Date): Promise<FeedItem[]> {
  return (await syncSource(userId, source, since)).items;
}

export class FeedActionError extends Error {}

export async function performFeedAction(
  userId: string,
  itemId: string,
  action: ActionType,
  payload?: ActionPayload,
): Promise<void> {
  const [source, ...rest] = itemId.split(":");
  const externalId = rest.join(":");
  const stored = await db.feedItemRecord.findFirst({
    where: { userId, source: source as Source, externalId },
    include: { snooze: true },
  });
  const adapter = ADAPTERS[source as Source];
  const account = await getAccount(userId, source as Source);
  if (!stored || !adapter || !account) throw new FeedActionError("Item not found");

  const item = fromRecord(stored);
  await adapter.performAction(account, item, action, payload);

  const updated = applyAction(item, action, payload);
  await db.feedItemRecord.update({
    where: { id: stored.id },
    data: { status: updated.status, replies: updated.replies as object[] },
  });
  await db.actionLog.create({
    data: { userId, source: stored.source, action, itemReceivedAt: stored.receivedAt },
  });
  if (updated.status === "snoozed" && updated.snoozedUntil) {
    await db.snooze.upsert({
      where: { itemId: stored.id },
      update: { until: new Date(updated.snoozedUntil) },
      create: { itemId: stored.id, until: new Date(updated.snoozedUntil) },
    });
  } else {
    await db.snooze.deleteMany({ where: { itemId: stored.id } });
  }
}
