import { generateJson, isAiConfigured } from "@/adapters/ai";
import { captureError } from "@/adapters/monitoring";
import { db } from "@/db/client";
import { fromRecord } from "@/features/feed/server/feed-service";
import type { FeedItem } from "@/features/feed/types";
import { TIME } from "@/lib/constants";
import {
  BRIEF_JSON_SCHEMA,
  BRIEF_SYSTEM_PROMPT,
  buildBriefPrompt,
  parseBrief,
} from "../brief-prompt";
import { buildLocalBrief, type Brief } from "../build-local-brief";
import { localDateKey } from "../local-date";

const LOOKBACK_MS = 2 * TIME.DAY_MS;
const MAX_RECORDS = 40;
/** A manual refresh is allowed this long after the last generation, to bound spend. */
const REFRESH_COOLDOWN_MS = 10 * TIME.MINUTE_MS;

export interface BriefResult {
  brief: Brief;
  /** "ai" = written by Claude; "local" = rule-based fallback (not cached). */
  origin: "ai" | "local";
  generatedAt: string;
}

interface BriefOptions {
  timeZone: string;
  refresh: boolean;
  now?: Date;
}

interface BriefDeps {
  generate?: typeof generateJson;
  aiConfigured?: boolean;
}

async function loadUnreadItems(userId: string, now: Date): Promise<FeedItem[]> {
  const records = await db.feedItemRecord.findMany({
    where: { userId, status: "unread", receivedAt: { gte: new Date(now.getTime() - LOOKBACK_MS) } },
    include: { snooze: true },
    orderBy: [{ priority: "asc" }, { receivedAt: "desc" }],
    take: MAX_RECORDS,
  });
  return records.map(fromRecord);
}

/** One AI brief per user per local day. Failures and empty inboxes fall back to the rule-based brief, uncached. */
export async function getDailyBrief(
  userId: string,
  { timeZone, refresh, now = new Date() }: BriefOptions,
  { generate = generateJson, aiConfigured = isAiConfigured() }: BriefDeps = {},
): Promise<BriefResult> {
  const date = new Date(`${localDateKey(now, timeZone)}T00:00:00Z`);
  const cached = await db.dailyBrief.findUnique({ where: { userId_date: { userId, date } } });
  const cooledDown = cached && now.getTime() - cached.generatedAt.getTime() > REFRESH_COOLDOWN_MS;
  if (cached && !(refresh && cooledDown)) {
    return {
      brief: JSON.parse(cached.content) as Brief,
      origin: "ai",
      generatedAt: cached.generatedAt.toISOString(),
    };
  }

  const items = await loadUnreadItems(userId, now);
  const local = (): BriefResult => ({
    brief: buildLocalBrief(items, now.getTime()),
    origin: "local",
    generatedAt: now.toISOString(),
  });
  if (items.length === 0 || !aiConfigured) return local();

  try {
    const text = await generate({
      system: BRIEF_SYSTEM_PROMPT,
      prompt: buildBriefPrompt(items, now),
      schema: BRIEF_JSON_SCHEMA,
    });
    const brief = parseBrief(text);
    await db.dailyBrief.upsert({
      where: { userId_date: { userId, date } },
      update: { content: JSON.stringify(brief), generatedAt: now },
      create: { userId, date, content: JSON.stringify(brief), generatedAt: now },
    });
    return { brief, origin: "ai", generatedAt: now.toISOString() };
  } catch (error) {
    captureError(error, { area: "brief", action: "generate" });
    return local();
  }
}
