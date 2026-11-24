import type { Source } from "@/features/feed/types";
import type { IntegrationAdapter, OAuthProvider } from "./types";
import { calendarAdapter } from "./calendar/adapter";
import { githubAdapter } from "./github/adapter";
import { githubOAuth } from "./github/oauth";
import { gmailAdapter } from "./gmail/adapter";
import { googleOAuth } from "./google/oauth";
import { slackAdapter } from "./slack/adapter";
import { slackOAuth } from "./slack/oauth";

/**
 * Adding an integration = one folder under `adapters/integrations/` plus one line in each map.
 * Sources without an entry are simply not connectable yet.
 */
export const ADAPTERS: Partial<Record<Source, IntegrationAdapter>> = {
  slack: slackAdapter,
  gmail: gmailAdapter,
  calendar: calendarAdapter,
  github: githubAdapter,
};

/** Gmail and Calendar share one Google grant, so both point at the same provider. */
export const OAUTH_PROVIDERS: Partial<Record<Source, OAuthProvider>> = {
  slack: slackOAuth,
  gmail: googleOAuth,
  calendar: googleOAuth,
  github: githubOAuth,
};
