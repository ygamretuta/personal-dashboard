import { createSentryClient, parseAccountId } from "@/adapters/integrations/sentry/client";
import { selectedProjectIds } from "@/adapters/integrations/sentry/adapter";
import type { SentryProject } from "@/adapters/integrations/sentry/types";
import { captureError } from "@/adapters/monitoring";
import { getAccount, updateAccountSettings } from "./accounts";

export interface SentryProjectChoices {
  projects: SentryProject[];
  /** Null means every project. */
  selected: string[] | null;
}

async function listProjects(userId: string) {
  const account = await getAccount(userId, "sentry");
  if (!account) return undefined;
  const { region, org } = parseAccountId(account.externalAccountId);
  const projects = await createSentryClient(account.accessToken, region).get<SentryProject[]>(
    `/organizations/${org}/projects/`,
  );
  return { account, projects };
}

/** What Settings shows: every project in the organization and which ones are watched. */
export async function getSentryProjectChoices(
  userId: string,
): Promise<SentryProjectChoices | undefined> {
  try {
    const listed = await listProjects(userId);
    if (!listed) return undefined;
    return {
      projects: listed.projects,
      selected: selectedProjectIds(listed.account.settings) ?? null,
    };
  } catch (error) {
    captureError(error, { area: "integrations", action: "listSentryProjects" });
    return undefined;
  }
}

/** Saves the picked projects. Unknown ids are dropped, and picking all (or none) means "every project". */
export async function saveSentryProjects(userId: string, requestedIds: string[]): Promise<void> {
  const listed = await listProjects(userId);
  if (!listed) return;
  const known = new Set(listed.projects.map((project) => project.id));
  const picked = [...new Set(requestedIds)].filter((id) => known.has(id));
  const everyProject = picked.length === 0 || picked.length === known.size;
  await updateAccountSettings(userId, "sentry", everyProject ? null : { projectIds: picked });
}
