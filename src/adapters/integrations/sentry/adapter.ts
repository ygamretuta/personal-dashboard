import type { IntegrationAdapter } from "../types";
import { createSentryClient, parseAccountId, type SentryClient, type SentryRegion } from "./client";
import { normalizeSentryIssue } from "./normalize";
import type { SentryIssue } from "./types";

const ISSUE_LIMIT = 50;
const WINDOW = "24h";

type ClientFactory = (token: string, region: SentryRegion) => SentryClient;

/** Project ids the user picked in Settings; nothing picked means every project. */
export function selectedProjectIds(settings?: Record<string, unknown>): string[] | undefined {
  const ids = settings?.projectIds;
  return Array.isArray(ids) && ids.length > 0 ? ids.map(String) : undefined;
}

export function createSentryAdapter(
  clientFactory: ClientFactory = createSentryClient,
): IntegrationAdapter {
  return {
    source: "sentry",

    /** Every unresolved issue seen in the last 24 hours. `since` is ignored so event counts stay current. */
    async fetchItems(account) {
      const { region, org } = parseAccountId(account.externalAccountId);
      const client = clientFactory(account.accessToken, region);
      const issues = await client.get<SentryIssue[]>(`/organizations/${org}/issues/`, {
        query: "is:unresolved",
        statsPeriod: WINDOW,
        sort: "date",
        limit: ISSUE_LIMIT,
        project: selectedProjectIds(account.settings),
      });
      return issues.map(normalizeSentryIssue);
    },

    // Read-only by design: opening, archiving and snoozing only change this app.
    async performAction() {},
  };
}

export const sentryAdapter = createSentryAdapter();
