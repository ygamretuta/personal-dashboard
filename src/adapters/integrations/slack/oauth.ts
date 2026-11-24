import { requireEnv } from "@/lib/env";
import type { OAuthProvider } from "../types";

/** Least privilege: only what reading mentions/DMs, replying and marking read needs. */
export const SLACK_USER_SCOPES = [
  "search:read",
  "im:history",
  "im:read",
  "im:write",
  "channels:history",
  "channels:write",
  "users:read",
  "chat:write",
];

interface SlackOAuthResponse {
  ok: boolean;
  error?: string;
  team?: { id: string };
  authed_user?: { id: string; access_token: string; scope?: string };
}

export const slackOAuth: OAuthProvider = {
  sources: ["slack"],
  buildAuthorizeUrl(state, redirectUri) {
    const url = new URL("https://slack.com/oauth/v2/authorize");
    url.searchParams.set("client_id", requireEnv("SLACK_CLIENT_ID"));
    url.searchParams.set("user_scope", SLACK_USER_SCOPES.join(","));
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    return url.toString();
  },

  async exchangeCode(code, redirectUri) {
    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      body: new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        client_id: requireEnv("SLACK_CLIENT_ID"),
        client_secret: requireEnv("SLACK_CLIENT_SECRET"),
      }),
    });
    const data = (await response.json()) as SlackOAuthResponse;
    if (!data.ok || !data.authed_user || !data.team)
      throw new Error(`Slack OAuth failed: ${data.error ?? "no user token"}`);
    return {
      externalAccountId: `${data.team.id}:${data.authed_user.id}`,
      accessToken: data.authed_user.access_token,
      scopes: data.authed_user.scope?.split(",") ?? SLACK_USER_SCOPES,
    };
  },
};
