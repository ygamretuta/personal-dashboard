import { PREVIEW_MAX_CHARS } from "@/lib/constants";
import type { FeedItem, Priority } from "@/features/feed/types";
import type { VercelDeployment } from "./types";

export const DEPLOYMENT_ID_PREFIX = "deployment:";
const SHORT_SHA_LENGTH = 7;
const FAILED = "ERROR";
const READY = "READY";

const stateOf = (deployment: VercelDeployment) => deployment.state ?? deployment.readyState;
const isProduction = (deployment: VercelDeployment) => deployment.target === "production";

/** Failures need you; successful production deploys are just a record that something shipped. */
export function isRelevantDeployment(deployment: VercelDeployment): boolean {
  const state = stateOf(deployment);
  return state === FAILED || (state === READY && isProduction(deployment));
}

function priorityFor(deployment: VercelDeployment): Priority {
  if (stateOf(deployment) !== FAILED) return "low";
  return isProduction(deployment) ? "high" : "normal";
}

export function normalizeDeployment(deployment: VercelDeployment, scope?: string): FeedItem {
  const failed = stateOf(deployment) === FAILED;
  const environment = isProduction(deployment) ? "production" : "preview";
  const { meta } = deployment;
  const author = deployment.creator?.username;

  const title = failed
    ? `${deployment.name}: ${environment} deployment failed`
    : `${deployment.name} deployed to production`;
  const body = [
    `${author ?? "Someone"} ${failed ? "triggered a failed" : "shipped a"} ${environment} deployment of ${deployment.name}${scope ? ` (${scope})` : ""}.`,
    meta?.githubCommitMessage?.trim(),
    [meta?.githubCommitRef, meta?.githubCommitSha?.slice(0, SHORT_SHA_LENGTH)]
      .filter(Boolean)
      .join(" @ "),
    `https://${deployment.url}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    id: `vercel:${DEPLOYMENT_ID_PREFIX}${deployment.uid}`,
    source: "vercel",
    kind: "deployment",
    externalId: `${DEPLOYMENT_ID_PREFIX}${deployment.uid}`,
    title,
    preview: body.replace(/\s+/g, " ").slice(0, PREVIEW_MAX_CHARS),
    body,
    sender: { name: author ?? "Vercel", handle: author },
    url: deployment.inspectorUrl ?? `https://${deployment.url}`,
    receivedAt: new Date(deployment.created).toISOString(),
    priority: priorityFor(deployment),
    status: failed ? "unread" : "read",
    actions: ["open", "archive", "snooze", "markRead"],
    replies: [],
  };
}
