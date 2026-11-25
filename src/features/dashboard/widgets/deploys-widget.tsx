import { CheckCircle2, Triangle, XCircle } from "lucide-react";
import { formatRelative } from "@/features/feed/format-time";
import type { FeedItem } from "@/features/feed/types";
import { isFailedDeployment } from "../derive";
import { EmptyNote, Widget, WidgetLink } from "./widget";

export function DeploysWidget({
  deployments,
  now,
  className,
}: {
  deployments: FeedItem[] | null;
  now: number;
  className?: string;
}) {
  return (
    <Widget
      title="Deployments"
      icon={Triangle}
      className={className}
      action={<WidgetLink href="https://vercel.com/dashboard">Vercel</WidgetLink>}
    >
      {deployments === null ? (
        <EmptyNote>Loading…</EmptyNote>
      ) : deployments.length === 0 ? (
        <EmptyNote>No recent deployments. Connect Vercel in Settings.</EmptyNote>
      ) : (
        <ul className="space-y-2.5">
          {deployments.map((deployment) => {
            const failed = isFailedDeployment(deployment);
            const StatusIcon = failed ? XCircle : CheckCircle2;
            return (
              <li key={deployment.id} className="flex items-start gap-2">
                <StatusIcon
                  size={16}
                  aria-hidden
                  className={`mt-0.5 shrink-0 ${failed ? "text-critical" : "text-good"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{deployment.title}</p>
                  <p className="text-xs text-muted">
                    <span className={`font-medium ${failed ? "text-critical" : "text-good"}`}>
                      {failed ? "Failed" : "Live"}
                    </span>
                    {" · "}
                    {formatRelative(deployment.receivedAt, now)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Widget>
  );
}
