import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OAUTH_PROVIDERS } from "@/adapters/integrations/registry";
import { getCurrentUserId } from "@/adapters/auth";
import type { Source } from "@/features/feed/types";
import { appOrigin, createState, stateCookieName, stateCookieOptions } from "@/lib/oauth-state";

export async function GET(request: Request, { params }: { params: Promise<{ source: string }> }) {
  const { source } = await params;
  const provider = OAUTH_PROVIDERS[source as Source];
  if (!provider) return NextResponse.json({ error: "Unknown integration" }, { status: 404 });

  const origin = appOrigin(request);
  if (!(await getCurrentUserId()))
    return NextResponse.redirect(`${origin}/api/auth/signin?callbackUrl=%2Fsettings`);

  const state = createState();
  (await cookies()).set(stateCookieName(source), state, stateCookieOptions);
  return NextResponse.redirect(
    provider.buildAuthorizeUrl(state, `${origin}/api/integrations/${source}/callback`),
  );
}
