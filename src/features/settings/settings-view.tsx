"use client";

import { SOURCES, type Source } from "@/features/feed/types";
import { useTheme } from "@/lib/use-theme";
import type { SentryProjectChoices } from "@/features/integrations/server/sentry-projects";
import { NotificationsCard } from "@/features/notifications/notifications-card";
import { SentryProjectsCard } from "./sentry-projects-card";
import { IntegrationCard, type IntegrationStatus, type TokenHelp } from "./integration-card";

export interface SettingsNotice {
  tone: "success" | "error";
  text: string;
}

interface SettingsViewProps {
  notice?: SettingsNotice;
  signedIn: boolean;
  connected: Source[];
  connectable: Source[];
  tokenHelp: Partial<Record<Source, TokenHelp>>;
  sentryChoices?: SentryProjectChoices;
}

function statusFor(
  source: Source,
  { signedIn, connected, connectable }: SettingsViewProps,
): IntegrationStatus {
  if (!connectable.includes(source)) return "unavailable";
  if (!signedIn) return "signed-out";
  return connected.includes(source) ? "connected" : "disconnected";
}

export function SettingsView(props: SettingsViewProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto w-full max-w-xl space-y-8 overflow-y-auto p-8">
      <h1 className="text-xl font-semibold">Settings</h1>

      {props.notice && (
        <p
          role="status"
          className={`rounded-lg border p-3 text-sm ${props.notice.tone === "error" ? "border-red-500/40 text-red-500" : "border-border"}`}
        >
          {props.notice.text}
        </p>
      )}

      <section aria-labelledby="integrations-heading" className="space-y-3">
        <h2 id="integrations-heading" className="text-sm font-medium">
          Integrations
        </h2>
        <p className="text-sm text-muted">
          You are viewing demo mode. Real accounts connect once you sign in.
        </p>
        <ul className="space-y-2">
          {SOURCES.map((source) => (
            <IntegrationCard
              key={source}
              source={source}
              status={statusFor(source, props)}
              tokenHelp={props.tokenHelp[source]}
            />
          ))}
        </ul>
        {props.sentryChoices && <SentryProjectsCard choices={props.sentryChoices} />}
      </section>

      {props.signedIn && <NotificationsCard />}

      <section aria-labelledby="appearance-heading" className="space-y-3">
        <h2 id="appearance-heading" className="text-sm font-medium">
          Appearance
        </h2>
        <label className="flex items-center justify-between rounded-lg border border-border bg-panel p-3 text-sm">
          Dark mode
          <input
            type="checkbox"
            role="switch"
            checked={theme === "dark"}
            onChange={toggleTheme}
            className="size-4 accent-[var(--color-primary)]"
          />
        </label>
      </section>
    </div>
  );
}
