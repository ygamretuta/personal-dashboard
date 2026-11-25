import { Skeleton } from "@/components/ui/skeleton";
import type { FeedItem } from "../types";
import { FeedItemRow } from "./feed-item-row";

interface FeedListProps {
  items: FeedItem[] | null; // null while loading
  selectedId?: string;
  freshIds: string[];
  now: number;
  onSelect: (id: string) => void;
  /** True when a search or unread filter is hiding items, so "Inbox zero" would be a lie. */
  narrowed?: boolean;
}

function FeedSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your inbox" className="space-y-1 p-4">
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="flex gap-3 py-2">
          <Skeleton className="size-7 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyInbox({ narrowed }: { narrowed: boolean }) {
  if (narrowed)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 p-8 text-center">
        <p className="text-lg">No matches</p>
        <p className="text-sm text-muted">Try a different search or clear the filters.</p>
      </div>
    );
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 p-8 text-center">
      <p className="text-lg">Inbox zero ☕</p>
      <p className="text-sm text-muted">Nothing needs you right now.</p>
    </div>
  );
}

export function FeedList({
  items,
  selectedId,
  freshIds,
  now,
  onSelect,
  narrowed = false,
}: FeedListProps) {
  if (!items) return <FeedSkeleton />;
  if (items.length === 0) return <EmptyInbox narrowed={narrowed} />;

  return (
    <ul
      role="listbox"
      aria-label="Inbox"
      aria-activedescendant={selectedId && `feed-${selectedId}`}
      className="flex-1 overflow-y-auto"
    >
      {items.map((item) => (
        <FeedItemRow
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          fresh={freshIds.includes(item.id)}
          now={now}
          onSelect={() => onSelect(item.id)}
        />
      ))}
    </ul>
  );
}
