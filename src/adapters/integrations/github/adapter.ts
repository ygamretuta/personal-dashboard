import { TIME } from "@/lib/constants";
import type { IntegrationAdapter } from "../types";
import { createGithubClient, GithubApiError, type GithubClient } from "./client";
import { fetchCommitItems } from "./commits";
import { isCommitId } from "./normalize-commit";
import { isSupportedReason, normalizeGithubNotification } from "./normalize";
import type { GithubComment, GithubNotification, GithubSubject } from "./types";

const DEFAULT_LOOKBACK_MS = 2 * TIME.DAY_MS;
const DENIED_STATUSES = [403, 404, 410];

type ClientFactory = (token: string) => GithubClient;

/** Pull request or comment details can be off limits (private repo, deleted); that is not a sync failure. */
async function getOptional<T>(client: GithubClient, url: string | null): Promise<T | undefined> {
  if (!url) return undefined;
  try {
    return await client.get<T>(url);
  } catch (error) {
    if (error instanceof GithubApiError && DENIED_STATUSES.includes(error.status)) return undefined;
    throw error;
  }
}

export function createGithubAdapter(
  clientFactory: ClientFactory = createGithubClient,
  now: () => number = Date.now,
): IntegrationAdapter {
  return {
    source: "github",

    async fetchItems(account, since) {
      const client = clientFactory(account.accessToken);
      const from = since ?? new Date(now() - DEFAULT_LOOKBACK_MS);
      const [notificationItems, commitItems] = await Promise.all([
        fetchNotificationItems(client, from),
        fetchCommitItems(client, from),
      ]);
      return [...notificationItems, ...commitItems];
    },

    async performAction(account, item, action) {
      // Commits are not GitHub notifications, so archive and mark read only exist in this app.
      if (isCommitId(item.externalId)) return;
      const client = clientFactory(account.accessToken);
      const thread = `/notifications/threads/${item.externalId}`;

      if (action === "reply") throw new Error("GitHub items cannot be replied to from here");
      if (action === "archive") await client.send("DELETE", thread); // "mark as done"
      if (action === "markRead") await client.send("PATCH", thread);
      // open and snooze are local to the app.
    },
  };
}

async function fetchNotificationItems(client: GithubClient, from: Date) {
  const notifications = await client.getAll<GithubNotification>("/notifications", {
    participating: true, // only threads you are directly involved in, not every watched repo
    since: from.toISOString(),
  });

  return Promise.all(
    notifications
      .filter((notification) => notification.unread && isSupportedReason(notification.reason))
      .map(async (notification) => {
        const [subject, comment] = await Promise.all([
          getOptional<GithubSubject>(client, notification.subject.url),
          notification.reason === "review_requested"
            ? undefined
            : getOptional<GithubComment>(client, notification.subject.latest_comment_url),
        ]);
        return normalizeGithubNotification(notification, { subject, comment });
      }),
  );
}

export const githubAdapter = createGithubAdapter();
