/** Raw Sentry payloads. These never leave `adapters/integrations/sentry`. */
export interface SentryProject {
  id: string;
  slug: string;
  name: string;
}

export interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit?: string;
  /** fatal, error, warning, info, debug */
  level: string;
  /** Event count, as a string. */
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
  project: SentryProject;
  metadata?: { type?: string; value?: string };
}
