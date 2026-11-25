import { GitCommitHorizontal, GitPullRequest } from "lucide-react";
import { formatRelative } from "@/features/feed/format-time";
import type { GithubSummary } from "../derive";
import { EmptyNote, Widget, WidgetLink } from "./widget";

export function GithubWidget({
  summary,
  now,
  inboxHref,
  className,
}: {
  summary: GithubSummary | null;
  now: number;
  inboxHref: string;
  className?: string;
}) {
  return (
    <Widget
      title="GitHub"
      icon={GitPullRequest}
      className={className}
      action={<WidgetLink href={inboxHref}>Open inbox</WidgetLink>}
    >
      {!summary ? (
        <EmptyNote>Loading…</EmptyNote>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-hover p-3">
              <p className="text-2xl font-semibold tabular-nums">{summary.reviewRequests.length}</p>
              <p className="text-xs text-muted">review requests waiting</p>
            </div>
            <div className="rounded-lg bg-hover p-3">
              <p className="text-2xl font-semibold tabular-nums">{summary.mentions}</p>
              <p className="text-xs text-muted">unread mentions</p>
            </div>
          </div>
          <h3 className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted">
            <GitCommitHorizontal size={13} aria-hidden /> Recent commits to your repos
          </h3>
          {summary.commits.length === 0 ? (
            <EmptyNote>No commits in the last couple of days.</EmptyNote>
          ) : (
            <ul className="divide-y divide-border">
              {summary.commits.map((commit) => (
                <li key={commit.id} className="flex items-baseline justify-between gap-3 py-1.5">
                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 truncate text-sm hover:underline"
                  >
                    {commit.title}
                  </a>
                  <span className="shrink-0 text-xs text-muted">
                    {commit.sender.handle ?? commit.sender.name} ·{" "}
                    {formatRelative(commit.receivedAt, now)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Widget>
  );
}
