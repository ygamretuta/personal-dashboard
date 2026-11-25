import { captureError } from "@/adapters/monitoring";
import { db } from "@/db/client";
import { notifyNewItems } from "@/features/notifications/server/notify";
import { requireEnv } from "@/lib/env";
import { syncSource } from "./feed-service";

export interface BackgroundSyncResult {
  accounts: number;
  failed: number;
}

/** Syncs every connected account and notifies about new high-priority items. One failure never stops the rest. */
export async function runBackgroundSync(): Promise<BackgroundSyncResult> {
  const appUrl = requireEnv("APP_URL");
  const accounts = await db.connectedAccount.findMany({ select: { userId: true, source: true } });
  const pairs = [...new Map(accounts.map((a) => [`${a.userId}:${a.source}`, a])).values()];

  let failed = 0;
  for (const { userId, source } of pairs) {
    try {
      const { fresh } = await syncSource(userId, source);
      await notifyNewItems(userId, fresh, `${appUrl}/inbox`);
    } catch (error) {
      failed += 1;
      captureError(error, { area: "cron", action: "syncSource", source });
    }
  }
  return { accounts: pairs.length, failed };
}
