import type { Source } from "@/features/feed/types";
import type { IntegrationAdapter, OAuthProvider, TokenProvider } from "./types";
import { calendarAdapter } from "./calendar/adapter";
import { githubAdapter } from "./github/adapter";
import { githubOAuth } from "./github/oauth";
import { gmailAdapter } from "./gmail/adapter";
import { googleOAuth } from "./google/oauth";
import { slackAdapter } from "./slack/adapter";
import { slackOAuth } from "./slack/oauth";
import { vercelAdapter } from "./vercel/adapter";
import { vercelToken } from "./vercel/token";

/**
 * Adding an integration = one folder under `adapters/integrations/` plus one line in each map.
 * Sources without an entry are simply not connectable yet.
 */
export const ADAPTERS: Partial<Record<Source, IntegrationAdapter>> = {
  slack: slackAdapter,
  gmail: gmailAdapter,
  calendar: calendarAdapter,
  github: githubAdapter,
  vercel: vercelAdapter,
};

/** Gmail and Calendar share one Google grant, so both point at the same provider. */
export const OAUTH_PROVIDERS: Partial<Record<Source, OAuthProvider>> = {
  slack: slackOAuth,
  gmail: googleOAuth,
  calendar: googleOAuth,
  github: githubOAuth,
};

/** Services connected by pasting a personal access token instead of an OAuth redirect. */
export const TOKEN_PROVIDERS: Partial<Record<Source, TokenProvider>> = {
  vercel: vercelToken,
};
