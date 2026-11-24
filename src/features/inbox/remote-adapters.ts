import type { AccountMap, AdapterMap, IntegrationAdapter } from "@/adapters/integrations/types";
import { bySource } from "@/features/feed/by-source";
import { SourceSyncError, type SyncErrorKind } from "@/features/feed/sync-errors";
import type { Source } from "@/features/feed/types";

async function failure(response: Response): Promise<SourceSyncError> {
  const body = (await response.json().catch(() => ({}))) as { kind?: SyncErrorKind };
  return new SourceSyncError(body.kind ?? "failed");
}

/** Browser-side adapters that talk to our own API; tokens and vendor calls stay on the server. */
function createRemoteAdapter(source: Source): IntegrationAdapter {
  return {
    source,
    async fetchItems(_account, since) {
      const params = new URLSearchParams({ source });
      if (since) params.set("since", since.toISOString());
      const response = await fetch(`/api/feed?${params}`);
      if (!response.ok) throw await failure(response);
      return (await response.json()).items;
    },
    async performAction(_account, item, action, payload) {
      const response = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, action, payload }),
      });
      if (!response.ok) throw await failure(response);
    },
  };
}

export const createRemoteAdapters = (): AdapterMap => bySource(createRemoteAdapter);

/** The server owns the real credentials, so the browser only passes placeholders. */
export const REMOTE_ACCOUNTS: AccountMap = bySource((source) => ({
  id: `remote-${source}`,
  source,
  externalAccountId: "remote",
  accessToken: "",
}));
