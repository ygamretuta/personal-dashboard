import { Flame } from "lucide-react";
import { SourceIcon } from "@/features/feed/components/source-icon";
import { formatRelative } from "@/features/feed/format-time";
import type { FeedItem } from "@/features/feed/types";
import { EmptyNote, Widget, WidgetLink } from "./widget";

interface AttentionWidgetProps {
  items: FeedItem[] | null;
  now: number;
  inboxHref: string;
  className?: string;
}

export function AttentionWidget({ items, now, inboxHref, className }: AttentionWidgetProps) {
  return (
    <Widget
      title="Needs your attention"
      icon={Flame}
      className={className}
      action={<WidgetLink href={inboxHref}>Open inbox</WidgetLink>}
    >
      {items === null ? (
        <EmptyNote>Loading…</EmptyNote>
      ) : items.length === 0 ? (
        <EmptyNote>Inbox zero ☕ Nothing needs you right now.</EmptyNote>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <a href={inboxHref} className="flex items-start gap-3 py-2.5 hover:bg-hover/60">
                <SourceIcon source={item.source} size={16} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {item.sender.name} · {item.preview}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted">
                  {formatRelative(item.receivedAt, now)}
                  {item.priority === "high" && (
                    <span className="rounded border border-critical/50 px-1 text-[10px] font-medium text-critical">
                      High
                    </span>
                  )}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}
