import { TIME } from "@/lib/constants";
import type { IntegrationAdapter } from "../types";
import { createVercelClient, VercelApiError, type VercelClient } from "./client";
import { isRelevantDeployment, normalizeDeployment } from "./normalize";
import type { VercelDeployment, VercelTeam } from "./types";

const DEFAULT_LOOKBACK_MS = 2 * TIME.DAY_MS;
const DEPLOYMENTS_PER_SCOPE = 30;
const TEAM_LIMIT = 20;
/** A team the token cannot read is skipped; it should not hide the rest. */
const SKIPPABLE_STATUSES = [403, 404];

type ClientFactory = (token: string) => VercelClient;

async function deploymentsFor(client: VercelClient, since: Date, team?: VercelTeam) {
  try {
    const { deployments = [] } = await client.get<{ deployments?: VercelDeployment[] }>(
      "/v6/deployments",
      { limit: DEPLOYMENTS_PER_SCOPE, since: since.getTime(), teamId: team?.id },
    );
    return deployments
      .filter(isRelevantDeployment)
      .map((deployment) => normalizeDeployment(deployment, team?.slug));
  } catch (error) {
    if (error instanceof VercelApiError && SKIPPABLE_STATUSES.includes(error.status)) return [];
    throw error;
  }
}

export function createVercelAdapter(
  clientFactory: ClientFactory = createVercelClient,
  now: () => number = Date.now,
): IntegrationAdapter {
  return {
    source: "vercel",

    /** Looks at your personal account and every team the token can see. */
    async fetchItems(account, since) {
      const client = clientFactory(account.accessToken);
      const from = since ?? new Date(now() - DEFAULT_LOOKBACK_MS);
      const { teams = [] } = await client.get<{ teams?: VercelTeam[] }>("/v2/teams", {
        limit: TEAM_LIMIT,
      });
      const perScope = await Promise.all([
        deploymentsFor(client, from),
        ...teams.map((team) => deploymentsFor(client, from, team)),
      ]);
      return perScope.flat();
    },

    // Deployments live on Vercel; opening, archiving and snoozing only change this app.
    async performAction() {},
  };
}

export const vercelAdapter = createVercelAdapter();
