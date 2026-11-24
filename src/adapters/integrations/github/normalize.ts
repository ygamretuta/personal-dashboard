import { PREVIEW_MAX_CHARS } from "@/lib/constants";
import type { FeedItem, FeedItemKind, Priority } from "@/features/feed/types";
import type { GithubComment, GithubNotification, GithubSubject } from "./types";

const MAX_QUOTE_CHARS = 600;

/** Notification reasons we surface, with how each appears in the feed. */
export const REASON_CONFIG: Record<
  string,
  { kind: FeedItemKind; priority: Priority; verb: string }
> = {
  review_requested: { kind: "review_request", priority: "high", verb: "requested your review on" },
  mention: { kind: "issue", priority: "normal", verb: "mentioned you in" },
  team_mention: { kind: "issue", priority: "normal", verb: "mentioned your team in" },
};

export const isSupportedReason = (reason: string) => reason in REASON_CONFIG;

/** `https://api.github.com/repos/o/r/pulls/142` -> 142 */
export const numberFromUrl = (url: string) => url.match(/\/(\d+)$/)?.[1];

export interface NotificationDetails {
  subject?: GithubSubject;
  comment?: GithubComment;
}

const quote = (text: string) => `"${text.trim().slice(0, MAX_QUOTE_CHARS)}"`;

function describe(
  notification: GithubNotification,
  { subject, comment }: NotificationDetails,
  reference: string,
  verb: string,
  author: string,
): string {
  const intro = `${author} ${verb} ${reference}.`;
  if (notification.reason === "review_requested") {
    const stats =
      subject?.changed_files !== undefined
        ? `+${subject.additions} −${subject.deletions} across ${subject.changed_files} file${subject.changed_files === 1 ? "" : "s"}`
        : "";
    return [intro, subject?.body?.trim(), stats].filter(Boolean).join("\n\n");
  }
  return [intro, comment?.body ? quote(comment.body) : undefined].filter(Boolean).join("\n\n");
}

/** Details are optional: when GitHub denies them (403/404) the item still shows, with less context. */
export function normalizeGithubNotification(
  notification: GithubNotification,
  details: NotificationDetails = {},
): FeedItem {
  const config = REASON_CONFIG[notification.reason];
  const number = numberFromUrl(notification.subject.url);
  const reference = number
    ? `${notification.repository.full_name}#${number}`
    : notification.repository.full_name;
  const author = details.comment?.user ?? details.subject?.user;
  const authorName = author?.login ?? "Someone";
  const body = describe(notification, details, reference, config.verb, authorName);

  return {
    id: `github:${notification.id}`,
    source: "github",
    kind: config.kind,
    externalId: notification.id,
    title: number ? `${notification.subject.title} (#${number})` : notification.subject.title,
    preview: body.replace(/\s+/g, " ").slice(0, PREVIEW_MAX_CHARS),
    body,
    sender: { name: authorName, avatarUrl: author?.avatar_url, handle: author?.login },
    url:
      details.comment?.html_url ??
      details.subject?.html_url ??
      `https://github.com/${notification.repository.full_name}`,
    receivedAt: notification.updated_at,
    priority: config.priority,
    status: "unread",
    actions: ["open", "archive", "snooze", "markRead"],
    replies: [],
  };
}
