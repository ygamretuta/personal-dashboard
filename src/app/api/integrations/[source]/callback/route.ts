import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OAUTH_PROVIDERS } from "@/adapters/integrations/registry";
import { getCurrentUserId } from "@/adapters/auth";
import { captureError } from "@/adapters/monitoring";
import type { Source } from "@/features/feed/types";
import { saveAccount } from "@/features/integrations/server/accounts";
import { appOrigin, stateCookieName } from "@/lib/oauth-state";

export async function GET(request: Request, { params }: { params: Promise<{ source: string }> }) {
  const { source } = await params;
  const provider = OAUTH_PROVIDERS[source as Source];
  if (!provider || provider.sources[0] !== source)
    return NextResponse.json({ error: "Unknown integration" }, { status: 404 });

  const origin = appOrigin(request);
  const settings = (query: string) => NextResponse.redirect(`${origin}/settings?${query}`);
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(stateCookieName(source))?.value;
  cookieStore.delete(stateCookieName(source));

  const userId = await getCurrentUserId();
  const code = url.searchParams.get("code");
  if (!userId || !code || !expectedState || url.searchParams.get("state") !== expectedState)
    return settings(`error=${source}`);

  try {
    const tokens = await provider.exchangeCode(
      code,
      `${origin}/api/integrations/${source}/callback`,
    );
    await Promise.all(provider.sources.map((connected) => saveAccount(userId, connected, tokens)));
    return settings(`connected=${source}`);
  } catch (error) {
    captureError(error, { area: "integrations", action: "oauthCallback", source });
    return settings(`error=${source}`);
  }
}
