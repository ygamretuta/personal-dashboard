import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/adapters/auth";
import {
  removeSubscription,
  saveSubscription,
} from "@/features/notifications/server/subscriptions";
import { isSameOrigin } from "@/lib/same-origin";

const subscribeSchema = z.object({
  endpoint: z.url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});
const unsubscribeSchema = z.object({ endpoint: z.url() });

async function authorize(request: Request) {
  if (!isSameOrigin(request)) return { error: NextResponse.json({}, { status: 403 }) };
  const userId = await getCurrentUserId();
  if (!userId) return { error: NextResponse.json({}, { status: 401 }) };
  return { userId };
}

export async function POST(request: Request) {
  const { userId, error } = await authorize(request);
  if (!userId) return error;
  const parsed = subscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  await saveSubscription(userId, { endpoint, p256dh: keys.p256dh, auth: keys.auth });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { userId, error } = await authorize(request);
  if (!userId) return error;
  const parsed = unsubscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await removeSubscription(userId, parsed.data.endpoint);
  return NextResponse.json({ ok: true });
}
