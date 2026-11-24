import { Avatar } from "@/components/ui/avatar";
import { formatRelative } from "../format-time";
import type { FeedItem } from "../types";
import { SourceIcon } from "./source-icon";

interface FeedItemRowProps {
  item: FeedItem;
  selected: boolean;
  fresh: boolean;
  now: number;
  onSelect: () => void;
}

export function FeedItemRow({ item, selected, fresh, now, onSelect }: FeedItemRowProps) {
  const isUnread = item.status === "unread";
  const time = formatRelative(item.dueAt ?? item.receivedAt, now);

  return (
    <li
      role="option"
      id={`feed-${item.id}`}
      aria-selected={selected}
      onClick={onSelect}
      className={`flex cursor-pointer gap-3 border-b border-border px-4 py-3 transition-colors ${
        selected ? "bg-selected" : "hover:bg-hover"
      } ${fresh ? "animate-slide-in" : ""}`}
    >
      <Avatar name={item.sender.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <SourceIcon source={item.source} size={14} />
          <span className={`truncate text-sm ${isUnread ? "font-semibold" : "text-muted"}`}>
            {item.sender.name}
          </span>
          {item.priority === "high" && (
            <span className="size-1.5 rounded-full bg-primary" title="High priority" />
          )}
          <span className="ml-auto shrink-0 text-xs text-muted">{time}</span>
        </div>
        <p className={`truncate text-sm ${isUnread ? "" : "text-muted"}`}>{item.title}</p>
        <p className="truncate text-xs text-muted">{item.preview}</p>
      </div>
    </li>
  );
}
