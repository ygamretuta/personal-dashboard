import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/adapters/auth";
import { getDailyBrief } from "@/features/brief/server/brief-service";

const querySchema = z.object({
  tz: z.string().max(64).default("UTC"),
  refresh: z.enum(["1"]).optional(),
});

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const result = await getDailyBrief(userId, {
    timeZone: parsed.data.tz,
    refresh: parsed.data.refresh === "1",
  });
  return NextResponse.json(result);
}
