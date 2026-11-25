import { db } from "@/db/client";
import { TIME } from "@/lib/constants";
import { STATS_WINDOW_DAYS, summarize, type Stats } from "../summarize";

export async function getStats(userId: string, now = new Date()): Promise<Stats> {
  const since = new Date(now.getTime() - STATS_WINDOW_DAYS * TIME.DAY_MS);
  const logs = await db.actionLog.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { source: true, action: true, itemReceivedAt: true, createdAt: true },
  });
  return summarize(logs, now);
}
