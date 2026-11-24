import type { SyncErrorKind } from "@/features/feed/sync-errors";
import { GithubApiError, GithubRateLimitError } from "./github/client";
import { GoogleApiError } from "./google/client";
import { SlackApiError } from "./slack/client";

/** A token request to an OAuth provider was refused; for a refresh this means the grant is gone. */
export class OAuthTokenError extends Error {
  constructor(readonly status: number) {
    super(`OAuth token request failed (${status})`);
  }
}

export interface ClassifiedError {
  kind: SyncErrorKind;
  retryAfterSeconds?: number;
}

const SLACK_AUTH_CODES = [
  "invalid_auth",
  "not_authed",
  "token_revoked",
  "token_expired",
  "account_inactive",
];
const SLACK_RATE_CODES = ["ratelimited", "rate_limited", "http_429"];
const RATE_LIMIT_STATUSES = [429, 503];
const AUTH_STATUSES = [400, 401];

/** Maps any vendor error onto the three cases the UI distinguishes. */
export function classifyAdapterError(error: unknown, now: number = Date.now()): ClassifiedError {
  if (error instanceof GithubRateLimitError) {
    return {
      kind: "rate_limited",
      retryAfterSeconds: Math.max(0, Math.ceil((error.resetAt.getTime() - now) / 1000)),
    };
  }
  if (error instanceof SlackApiError) {
    if (SLACK_AUTH_CODES.includes(error.code)) return { kind: "auth" };
    if (SLACK_RATE_CODES.includes(error.code)) return { kind: "rate_limited" };
  }
  if (error instanceof GoogleApiError || error instanceof GithubApiError) {
    if (error.status === 401) return { kind: "auth" };
    if (RATE_LIMIT_STATUSES.includes(error.status)) return { kind: "rate_limited" };
  }
  if (error instanceof OAuthTokenError && AUTH_STATUSES.includes(error.status))
    return { kind: "auth" };
  return { kind: "failed" };
}
