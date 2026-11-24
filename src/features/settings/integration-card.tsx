import { SourceIcon } from "@/features/feed/components/source-icon";
import { SOURCE_CONFIG } from "@/features/feed/sources";
import type { Source } from "@/features/feed/types";

export type IntegrationStatus = "connected" | "disconnected" | "unavailable" | "signed-out";

const STATUS_TEXT: Record<IntegrationStatus, string> = {
  connected: "Connected",
  disconnected: "Not connected",
  unavailable: "Coming soon",
  "signed-out": "Sign in to connect",
};

function CardAction({ source, status }: { source: Source; status: IntegrationStatus }) {
  if (status === "connected") {
    return (
      <form action={`/api/integrations/${source}/disconnect`} method="post">
        <button type="submit" className="btn">
          Disconnect
        </button>
      </form>
    );
  }
  if (status === "disconnected") {
    return (
      <a href={`/api/integrations/${source}/connect`} className="btn btn-primary">
        Connect
      </a>
    );
  }
  return (
    <button type="button" disabled className="btn opacity-60">
      Connect
    </button>
  );
}

export function IntegrationCard({ source, status }: { source: Source; status: IntegrationStatus }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-panel p-3">
      <SourceIcon source={source} size={20} />
      <div className="flex-1">
        <p className="text-sm font-medium">{SOURCE_CONFIG[source].label}</p>
        <p className="text-xs text-muted">{STATUS_TEXT[status]}</p>
      </div>
      <CardAction source={source} status={status} />
    </li>
  );
}
