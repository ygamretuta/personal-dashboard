import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { captureError } from "@/adapters/monitoring";
import { runBackgroundSync } from "@/features/feed/server/background-sync";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || header.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

/** Called on a schedule (GitHub Actions) so notifications arrive while no tab is open. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await runBackgroundSync());
  } catch (error) {
    captureError(error, { area: "cron", action: "sync" });
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
