import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/adapters/auth";
import { classifyAdapterError } from "@/adapters/integrations/errors";
import { captureError } from "@/adapters/monitoring";
import { newEventSchema } from "@/features/calendar/new-event";
import {
  addEvent,
  CalendarAccessError,
  listEntries,
} from "@/features/calendar/server/calendar-service";
import { isSameOrigin } from "@/lib/same-origin";

const rangeSchema = z.object({ from: z.iso.datetime(), to: z.iso.datetime() });
const STATUS_BY_KIND = { auth: 401, rate_limited: 429, failed: 502 } as const;

function failure(error: unknown, action: string) {
  if (error instanceof CalendarAccessError)
    return NextResponse.json({ error: error.reason }, { status: 403 });
  const { kind } = classifyAdapterError(error);
  if (kind === "failed") captureError(error, { area: "calendar", action });
  return NextResponse.json(
    { error: "Calendar request failed", kind },
    { status: STATUS_BY_KIND[kind] },
  );
}

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const range = rangeSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!range.success) return NextResponse.json({ error: "Invalid range" }, { status: 400 });

  try {
    const entries = await listEntries(userId, new Date(range.data.from), new Date(range.data.to));
    return NextResponse.json({ entries });
  } catch (error) {
    return failure(error, "list");
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = newEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid event" },
      { status: 400 },
    );

  try {
    return NextResponse.json({ entry: await addEvent(userId, parsed.data) });
  } catch (error) {
    return failure(error, "create");
  }
}
