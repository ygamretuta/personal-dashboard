import { NextResponse } from "next/server";
import { OAUTH_PROVIDERS } from "@/adapters/integrations/registry";
import { getCurrentUserId } from "@/adapters/auth";
import type { Source } from "@/features/feed/types";
import { deleteAccounts } from "@/features/integrations/server/accounts";
import { appOrigin } from "@/lib/oauth-state";
import { isSameOrigin } from "@/lib/same-origin";

export async function POST(request: Request, { params }: { params: Promise<{ source: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { source } = await params;
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Disconnecting one source of a shared grant (Gmail/Calendar) disconnects them all.
  const sources = OAUTH_PROVIDERS[source as Source]?.sources ?? [source as Source];
  await Promise.all(sources.map((connected) => deleteAccounts(userId, connected)));
  return NextResponse.redirect(`${appOrigin(request)}/settings`, 303);
}
