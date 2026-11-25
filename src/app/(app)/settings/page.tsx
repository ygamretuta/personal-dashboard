import { Suspense } from "react";
import { OAUTH_PROVIDERS, TOKEN_PROVIDERS } from "@/adapters/integrations/registry";
import { getCurrentUserId } from "@/adapters/auth";
import { SOURCE_CONFIG } from "@/features/feed/sources";
import { SOURCES, type Source } from "@/features/feed/types";
import { listConnectedSources } from "@/features/integrations/server/accounts";
import { SettingsView, type SettingsNotice } from "@/features/settings/settings-view";

const CONNECTABLE = [...Object.keys(OAUTH_PROVIDERS), ...Object.keys(TOKEN_PROVIDERS)] as Source[];
const TOKEN_HELP = Object.fromEntries(
  Object.entries(TOKEN_PROVIDERS).map(([source, { helpUrl, helpText }]) => [
    source,
    { helpUrl, helpText },
  ]),
);

/** Only known source names are ever shown, so a crafted URL cannot put text on the page. */
function noticeFrom(
  params: Record<string, string | string[] | undefined>,
): SettingsNotice | undefined {
  const find = (key: string) => SOURCES.find((source) => source === params[key]);
  const connected = find("connected");
  if (connected) return { tone: "success", text: `${SOURCE_CONFIG[connected].label} connected.` };
  const failed = find("error");
  if (failed)
    return {
      tone: "error",
      text: `Couldn't connect ${SOURCE_CONFIG[failed].label}. Please try again.`,
    };
  return undefined;
}

async function Settings({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [userId, params] = await Promise.all([getCurrentUserId(), searchParams]);
  const connected = userId ? await listConnectedSources(userId) : [];
  return (
    <SettingsView
      signedIn={Boolean(userId)}
      connected={connected}
      connectable={CONNECTABLE}
      tokenHelp={TOKEN_HELP}
      notice={noticeFrom(params)}
    />
  );
}

export default function SettingsPage({ searchParams }: PageProps<"/settings">) {
  return (
    <Suspense>
      <Settings searchParams={searchParams} />
    </Suspense>
  );
}
