import { PREVIEW_MAX_CHARS } from "@/lib/constants";
import type { FeedItem, Priority } from "@/features/feed/types";
import type { SentryIssue } from "./types";

export const ISSUE_ID_PREFIX = "issue:";

const PRIORITY_BY_LEVEL: Record<string, Priority> = {
  fatal: "high",
  error: "high",
  warning: "normal",
};

const plural = (count: number, word: string) =>
  `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;

export function normalizeSentryIssue(issue: SentryIssue): FeedItem {
  const events = Number(issue.count) || 0;
  const stats = `${plural(events, "event")} · ${plural(issue.userCount, "user")} affected`;
  const body = [
    `${issue.level} in ${issue.project.name}`,
    issue.metadata?.value,
    issue.culprit ? `Culprit: ${issue.culprit}` : undefined,
    stats,
    `First seen ${issue.firstSeen}\nLast seen ${issue.lastSeen}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    id: `sentry:${ISSUE_ID_PREFIX}${issue.id}`,
    source: "sentry",
    kind: "error",
    externalId: `${ISSUE_ID_PREFIX}${issue.id}`,
    title: issue.title,
    preview: `${issue.project.slug}: ${issue.culprit ?? issue.metadata?.value ?? ""} · ${stats}`
      .replace(/\s+/g, " ")
      .slice(0, PREVIEW_MAX_CHARS),
    body,
    sender: { name: issue.project.name, handle: issue.shortId },
    url: issue.permalink,
    receivedAt: issue.lastSeen,
    priority: PRIORITY_BY_LEVEL[issue.level] ?? "low",
    status: "unread",
    actions: ["open", "archive", "snooze", "markRead"],
    replies: [],
  };
}
