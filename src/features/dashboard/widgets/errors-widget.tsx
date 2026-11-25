import { Bug } from "lucide-react";
import { formatRelative } from "@/features/feed/format-time";
import type { ErrorSummary } from "../derive";
import { EmptyNote, Widget, WidgetLink } from "./widget";

export function ErrorsWidget({
  summary,
  now,
  inboxHref,
  className,
}: {
  summary: ErrorSummary | null;
  now: number;
  inboxHref: string;
  className?: string;
}) {
  return (
    <Widget
      title="Errors"
      icon={Bug}
      className={className}
      action={<WidgetLink href={inboxHref}>Open inbox</WidgetLink>}
    >
      {!summary ? (
        <EmptyNote>Loading…</EmptyNote>
      ) : summary.open === 0 ? (
        <EmptyNote>
          No unresolved errors in the last 24 hours. Connect Sentry in Settings.
        </EmptyNote>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-hover p-3">
              <p className="text-2xl font-semibold tabular-nums">{summary.open}</p>
              <p className="text-xs text-muted">open issues, last 24h</p>
            </div>
            <div className="rounded-lg bg-hover p-3">
              <p className="text-2xl font-semibold tabular-nums">{summary.critical}</p>
              <p className="text-xs text-muted">errors or fatal</p>
            </div>
          </div>
          <ul className="divide-y divide-border">
            {summary.top.map((issue) => (
              <li key={issue.id} className="py-1.5">
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm hover:underline"
                >
                  {issue.title}
                </a>
                <p className="truncate text-xs text-muted">
                  {issue.sender.handle} · {issue.preview.split("·").slice(1).join("·").trim()} ·{" "}
                  {formatRelative(issue.receivedAt, now)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </Widget>
  );
}
