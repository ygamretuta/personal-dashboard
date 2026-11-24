import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/adapters/auth";
import { classifyAdapterError } from "@/adapters/integrations/errors";
import { captureError } from "@/adapters/monitoring";
import { isSameOrigin } from "@/lib/same-origin";
import { FeedActionError, performFeedAction } from "@/features/feed/server/feed-service";

const bodySchema = z.object({
  itemId: z.string().min(1),
  action: z.enum(["reply", "archive", "snooze", "markRead", "open"]),
  payload: z
    .object({ text: z.string().max(4000).optional(), until: z.iso.datetime().optional() })
    .optional(),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { itemId, action, payload } = parsed.data;
  try {
    await performFeedAction(userId, itemId, action, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof FeedActionError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    const { kind } = classifyAdapterError(error);
    if (kind === "failed") captureError(error, { area: "feed", action, itemId });
    return NextResponse.json(
      { error: "Action failed", kind },
      { status: { auth: 401, rate_limited: 429, failed: 502 }[kind] },
    );
  }
}
