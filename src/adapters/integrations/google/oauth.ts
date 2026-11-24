import { requireEnv } from "@/lib/env";
import { OAuthTokenError } from "../errors";
import type { OAuthProvider } from "../types";

export const GMAIL_MODIFY_SCOPE = "https://www.googleapis.com/auth/gmail.modify";
export const CALENDAR_READ_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

/** One consent screen covers Gmail and Calendar. Sending is needed for replies. */
export const GOOGLE_SCOPES = [
  "openid",
  GMAIL_MODIFY_SCOPE,
  "https://www.googleapis.com/auth/gmail.send",
  CALENDAR_READ_SCOPE,
];
const REQUIRED_SCOPES = [GMAIL_MODIFY_SCOPE, CALENDAR_READ_SCOPE];

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

const expiryFrom = (seconds: number, now: number) => new Date(now + seconds * 1000);

export function createGoogleOAuth(
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): OAuthProvider {
  async function requestToken(params: Record<string, string>): Promise<TokenResponse> {
    const response = await fetchImpl(TOKEN_URL, {
      method: "POST",
      body: new URLSearchParams({
        client_id: requireEnv("GOOGLE_CLIENT_ID"),
        client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
        ...params,
      }),
    });
    if (!response.ok) throw new OAuthTokenError(response.status);
    return (await response.json()) as TokenResponse;
  }

  return {
    sources: ["gmail", "calendar"],

    buildAuthorizeUrl(state, redirectUri) {
      const url = new URL(AUTHORIZE_URL);
      url.searchParams.set("client_id", requireEnv("GOOGLE_CLIENT_ID"));
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
      // offline + consent guarantees a refresh token, since access tokens last an hour.
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");
      url.searchParams.set("state", state);
      return url.toString();
    },

    async exchangeCode(code, redirectUri) {
      const token = await requestToken({
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      const scopes = token.scope?.split(" ") ?? [];
      const missing = REQUIRED_SCOPES.filter((scope) => !scopes.includes(scope));
      if (missing.length > 0)
        throw new Error("Google access was granted without every required permission");

      const userInfo = await fetchImpl(USERINFO_URL, {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      if (!userInfo.ok) throw new Error(`Google userinfo failed (${userInfo.status})`);
      const { sub } = (await userInfo.json()) as { sub: string };

      return {
        externalAccountId: sub,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: expiryFrom(token.expires_in, now()),
        scopes,
      };
    },

    async refresh(refreshToken) {
      const token = await requestToken({
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      });
      return { accessToken: token.access_token, expiresAt: expiryFrom(token.expires_in, now()) };
    },
  };
}

export const googleOAuth = createGoogleOAuth();
