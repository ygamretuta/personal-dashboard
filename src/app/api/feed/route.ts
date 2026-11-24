import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/adapters/auth";
import { classifyAdapterError } from "@/adapters/integrations/errors";
import { captureError } from "@/adapters/monitoring";
import { fetchFeed } from "@/features/feed/server/feed-service";
import { SOURCES } from "@/features/feed/types";

const querySchema = z.object({
  source: z.enum(SOURCES as [string, ...string[]]),
  since: z.iso.datetime().optional(),
});

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const { source, since } = parsed.data;
  try {
    const items = await fetchFeed(
      userId,
      source as (typeof SOURCES)[number],
      since ? new Date(since) : undefined,
    );
    return NextResponse.json({ items });
  } catch (error) {
    const { kind, retryAfterSeconds } = classifyAdapterError(error);
    if (kind === "failed") captureError(error, { area: "feed", action: "fetchFeed", source });
    const status = { auth: 401, rate_limited: 429, failed: 502 }[kind];
    const headers = retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined;
    return NextResponse.json({ error: "Sync failed", kind }, { status, headers });
  }
}
