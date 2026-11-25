import { PREVIEW_MAX_CHARS } from "@/lib/constants";
import type { FeedItem } from "@/features/feed/types";
import type { GithubCommit } from "./types";

export const COMMIT_ID_PREFIX = "commit:";
const SHORT_SHA_LENGTH = 7;

export const isCommitId = (externalId: string) => externalId.startsWith(COMMIT_ID_PREFIX);

/**
 * Commits are a stream, not a to-do list: your own arrive already read and low priority,
 * so only other people's commits to your repos count as unread.
 */
export function normalizeGithubCommit(
  commit: GithubCommit,
  repo: string,
  viewerLogin: string,
): FeedItem {
  const [subject, ...rest] = commit.commit.message.trim().split("\n");
  const authorName = commit.author?.login ?? commit.commit.committer?.name ?? "Unknown";
  const own = commit.author?.login === viewerLogin;
  const shortSha = commit.sha.slice(0, SHORT_SHA_LENGTH);
  const detail = rest.join("\n").trim();
  const body = [`${authorName} pushed ${shortSha} to ${repo}.`, subject, detail]
    .filter(Boolean)
    .join("\n\n");

  return {
    id: `github:${COMMIT_ID_PREFIX}${repo}:${commit.sha}`,
    source: "github",
    kind: "commit",
    externalId: `${COMMIT_ID_PREFIX}${repo}:${commit.sha}`,
    title: `${subject} (${repo}@${shortSha})`,
    preview: `${authorName}: ${detail || subject}`.replace(/\s+/g, " ").slice(0, PREVIEW_MAX_CHARS),
    body,
    sender: {
      name: authorName,
      avatarUrl: commit.author?.avatar_url,
      handle: commit.author?.login,
    },
    url: commit.html_url,
    receivedAt: commit.commit.committer?.date ?? new Date(0).toISOString(),
    priority: own ? "low" : "normal",
    status: own ? "read" : "unread",
    actions: ["open", "archive", "snooze", "markRead"],
    replies: [],
  };
}
