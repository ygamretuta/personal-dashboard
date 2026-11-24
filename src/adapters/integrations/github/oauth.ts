import { requireEnv } from "@/lib/env";
import type { OAuthProvider } from "../types";

/**
 * `notifications` lists review requests and mentions. `repo` is the one broad scope: GitHub only
 * lets us read a private repository's pull request details with it.
 */
export const GITHUB_SCOPES = ["notifications", "repo"];

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const USER_URL = "https://api.github.com/user";

interface TokenResponse {
  access_token?: string;
  scope?: string;
  error?: string;
}

export function createGithubOAuth(fetchImpl: typeof fetch = fetch): OAuthProvider {
  return {
    sources: ["github"],

    buildAuthorizeUrl(state, redirectUri) {
      const url = new URL(AUTHORIZE_URL);
      url.searchParams.set("client_id", requireEnv("GITHUB_CLIENT_ID"));
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("scope", GITHUB_SCOPES.join(" "));
      url.searchParams.set("state", state);
      return url.toString();
    },

    // OAuth-app tokens do not expire, so there is no refresh step.
    async exchangeCode(code, redirectUri) {
      const response = await fetchImpl(TOKEN_URL, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new URLSearchParams({
          code,
          redirect_uri: redirectUri,
          client_id: requireEnv("GITHUB_CLIENT_ID"),
          client_secret: requireEnv("GITHUB_CLIENT_SECRET"),
        }),
      });
      const token = (await response.json()) as TokenResponse;
      if (!token.access_token) throw new Error(`GitHub OAuth failed: ${token.error ?? "no token"}`);

      const scopes = token.scope?.split(",") ?? [];
      if (!GITHUB_SCOPES.every((scope) => scopes.includes(scope)))
        throw new Error("GitHub access was granted without every required permission");

      const user = await fetchImpl(USER_URL, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          Accept: "application/vnd.github+json",
        },
      });
      if (!user.ok) throw new Error(`GitHub user lookup failed (${user.status})`);
      const { id } = (await user.json()) as { id: number };

      return { externalAccountId: String(id), accessToken: token.access_token, scopes };
    },
  };
}

export const githubOAuth = createGithubOAuth();
