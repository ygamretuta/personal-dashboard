import { Plug } from "lucide-react";
import { SourceIcon } from "@/features/feed/components/source-icon";
import { SOURCE_CONFIG } from "@/features/feed/sources";
import type { SyncErrorKind } from "@/features/feed/sync-errors";
import { SOURCES, type Source } from "@/features/feed/types";
import { Widget, WidgetLink } from "./widget";

const ERROR_TEXT: Record<SyncErrorKind, string> = {
  auth: "Reconnect needed",
  rate_limited: "Rate limited",
  failed: "Sync failed",
};

interface ConnectionsWidgetProps {
  connected: Source[];
  errors: Partial<Record<Source, SyncErrorKind>>;
  className?: string;
}

export function ConnectionsWidget({ connected, errors, className }: ConnectionsWidgetProps) {
  return (
    <Widget
      title="Connections"
      icon={Plug}
      className={className}
      action={<WidgetLink href="/settings">Manage</WidgetLink>}
    >
      <ul className="space-y-2">
        {SOURCES.map((source) => {
          const error = errors[source];
          const isConnected = connected.includes(source);
          const text = !isConnected ? "Not connected" : error ? ERROR_TEXT[error] : "Synced";
          const tone = !isConnected ? "bg-border" : error ? "bg-critical" : "bg-good";
          return (
            <li key={source} className="flex items-center gap-2 text-sm">
              <SourceIcon source={source} size={15} />
              <span className="flex-1">{SOURCE_CONFIG[source].label}</span>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <span aria-hidden className={`size-2 rounded-full ${tone}`} />
                {text}
              </span>
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}
