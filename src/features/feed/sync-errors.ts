import { SOURCE_CONFIG } from "./sources";
import type { Source } from "./types";

/** auth: the connection must be redone. rate_limited: wait. failed: anything else, retried on the next sync. */
export type SyncErrorKind = "auth" | "rate_limited" | "failed";

export class SourceSyncError extends Error {
  constructor(readonly kind: SyncErrorKind) {
    super(`Sync failed: ${kind}`);
  }
}

interface SyncErrorConfig {
  message: (source: Source) => string;
  action?: { label: string; href: string };
}

/** What the user sees for each kind of failure. */
export const SYNC_ERROR_CONFIG: Record<SyncErrorKind, SyncErrorConfig> = {
  auth: {
    message: (source) => `${SOURCE_CONFIG[source].label} needs to be reconnected.`,
    action: { label: "Reconnect", href: "/settings" },
  },
  rate_limited: {
    message: (source) =>
      `${SOURCE_CONFIG[source].label} is rate limiting us. We'll try again shortly.`,
  },
  failed: {
    message: (source) => `Couldn't sync ${SOURCE_CONFIG[source].label}. We'll try again shortly.`,
  },
};

export const kindOf = (reason: unknown): SyncErrorKind =>
  reason instanceof SourceSyncError ? reason.kind : "failed";
