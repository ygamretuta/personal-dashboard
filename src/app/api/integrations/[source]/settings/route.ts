import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/adapters/auth";
import { captureError } from "@/adapters/monitoring";
import { saveSentryProjects } from "@/features/integrations/server/sentry-projects";
import { appOrigin } from "@/lib/oauth-state";
import { isSameOrigin } from "@/lib/same-origin";

/** Saves per-connection choices. Only Sentry has any today: which projects to watch. */
export async function POST(request: Request, { params }: { params: Promise<{ source: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { source } = await params;
  if (source !== "sentry")
    return NextResponse.json({ error: "Unknown integration" }, { status: 404 });
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const back = (query: string) =>
    NextResponse.redirect(`${appOrigin(request)}/settings?${query}`, 303);
  try {
    const ids = (await request.formData()).getAll("projectId").map(String);
    await saveSentryProjects(userId, ids);
    return back("saved=sentry");
  } catch (error) {
    captureError(error, { area: "integrations", action: "saveSentryProjects" });
    return back("error=sentry");
  }
}
