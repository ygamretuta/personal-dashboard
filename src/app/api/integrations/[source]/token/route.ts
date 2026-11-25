import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/adapters/auth";
import { TOKEN_PROVIDERS } from "@/adapters/integrations/registry";
import { captureError } from "@/adapters/monitoring";
import type { Source } from "@/features/feed/types";
import { saveAccount } from "@/features/integrations/server/accounts";
import { appOrigin } from "@/lib/oauth-state";
import { isSameOrigin } from "@/lib/same-origin";

const MAX_TOKEN_LENGTH = 512;

/** Connects a service by personal access token. The token is checked, then stored encrypted. */
export async function POST(request: Request, { params }: { params: Promise<{ source: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { source } = await params;
  const provider = TOKEN_PROVIDERS[source as Source];
  if (!provider) return NextResponse.json({ error: "Unknown integration" }, { status: 404 });
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = (query: string) =>
    NextResponse.redirect(`${appOrigin(request)}/settings?${query}`, 303);
  const token = String((await request.formData()).get("token") ?? "").trim();
  if (!token || token.length > MAX_TOKEN_LENGTH) return settings(`error=${source}`);

  try {
    await saveAccount(userId, source as Source, await provider.verify(token));
    return settings(`connected=${source}`);
  } catch (error) {
    // A rejected token is the user's to fix, not an error worth reporting.
    if (!(error instanceof Error) || !/\b(401|403)\b/.test(error.message))
      captureError(error, { area: "integrations", action: "tokenConnect", source });
    return settings(`error=${source}`);
  }
}
