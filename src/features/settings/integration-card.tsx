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

export interface TokenHelp {
  helpUrl: string;
  helpText: string;
  fields?: {
    name: string;
    label: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
  }[];
}

function TokenForm({ source, help }: { source: Source; help: TokenHelp }) {
  return (
    <form
      action={`/api/integrations/${source}/token`}
      method="post"
      className="mt-2 flex w-full flex-wrap items-center gap-2"
    >
      {help.fields?.map((field) =>
        field.options ? (
          <select
            key={field.name}
            name={field.name}
            aria-label={field.label}
            className="rounded-md border border-border bg-background px-2.5 py-1 text-sm"
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            key={field.name}
            name={field.name}
            required
            autoComplete="off"
            aria-label={field.label}
            placeholder={field.label}
            className="w-40 rounded-md border border-border bg-background px-2.5 py-1 text-sm"
          />
        ),
      )}
      <input
        name="token"
        type="password"
        required
        autoComplete="off"
        aria-label={`${SOURCE_CONFIG[source].label} access token`}
        placeholder="Paste access token"
        className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1 text-sm"
      />
      <button type="submit" className="btn btn-primary">
        Connect
      </button>
      <p className="w-full text-xs text-muted">
        {help.helpText}{" "}
        <a href={help.helpUrl} target="_blank" rel="noopener noreferrer" className="underline">
          Create a token
        </a>
      </p>
    </form>
  );
}

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

interface IntegrationCardProps {
  source: Source;
  status: IntegrationStatus;
  /** Set for services connected with a pasted access token instead of an OAuth button. */
  tokenHelp?: TokenHelp;
}

export function IntegrationCard({ source, status, tokenHelp }: IntegrationCardProps) {
  const asksForToken = tokenHelp && status === "disconnected";
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-panel p-3">
      <SourceIcon source={source} size={20} />
      <div className="flex-1">
        <p className="text-sm font-medium">{SOURCE_CONFIG[source].label}</p>
        <p className="text-xs text-muted">{STATUS_TEXT[status]}</p>
      </div>
      {!asksForToken && <CardAction source={source} status={status} />}
      {asksForToken && <TokenForm source={source} help={tokenHelp} />}
    </li>
  );
}
