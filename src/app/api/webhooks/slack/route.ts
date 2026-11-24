import { NextResponse } from "next/server";
import { slackAdapter } from "@/adapters/integrations/slack/adapter";
import { verifySlackSignature } from "@/adapters/integrations/slack/signature";
import type { SlackEventEnvelope } from "@/adapters/integrations/slack/types";
import { captureError } from "@/adapters/monitoring";
import { storeItems } from "@/features/feed/server/feed-service";
import { findAccountByExternalId } from "@/features/integrations/server/accounts";
import { requireEnv } from "@/lib/env";

export async function POST(request: Request) {
  const body = await request.text();
  const verified = verifySlackSignature({
    signingSecret: requireEnv("SLACK_SIGNING_SECRET"),
    timestamp: request.headers.get("x-slack-request-timestamp"),
    signature: request.headers.get("x-slack-signature"),
    body,
  });
  if (!verified) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const envelope = JSON.parse(body) as SlackEventEnvelope;
  if (envelope.type === "url_verification")
    return NextResponse.json({ challenge: envelope.challenge });
  if (envelope.type !== "event_callback" || !envelope.event) return NextResponse.json({ ok: true });

  // One event can concern several connected users; each gets their own view of it.
  for (const { user_id, team_id } of envelope.authorizations ?? []) {
    try {
      const match = await findAccountByExternalId("slack", `${team_id}:${user_id}`);
      const item = match && (await slackAdapter.itemFromEvent(match.account, envelope.event));
      if (match && item) await storeItems(match.userId, "slack", [item]);
    } catch (error) {
      captureError(error, { area: "integrations", action: "slackWebhook", teamId: team_id });
    }
  }
  return NextResponse.json({ ok: true });
}
