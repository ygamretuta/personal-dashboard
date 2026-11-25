"use client";

import { useState } from "react";
import { usePush, type PushState } from "./use-push";

const DESCRIPTIONS: Record<PushState, string> = {
  loading: "Checking this browser…",
  unsupported: "This browser can't receive push notifications.",
  blocked: "Notifications are blocked. Allow them in your browser's site settings.",
  off: "Get a notification when a high-priority item arrives, even with the tab closed.",
  on: "On for this browser. You'll be notified about new high-priority items.",
};

export function NotificationsCard() {
  const { state, enable, disable } = usePush();
  const [failed, setFailed] = useState(false);
  const canToggle = state === "on" || state === "off";

  const toggle = async () => {
    setFailed(false);
    try {
      await (state === "on" ? disable() : enable());
    } catch {
      setFailed(true);
    }
  };

  return (
    <section aria-labelledby="notifications-heading" className="space-y-3">
      <h2 id="notifications-heading" className="text-sm font-medium">
        Notifications
      </h2>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-panel p-3">
        <p className="text-sm text-muted">{DESCRIPTIONS[state]}</p>
        {canToggle && (
          <button type="button" onClick={toggle} className="btn shrink-0">
            {state === "on" ? "Turn off" : "Turn on"}
          </button>
        )}
      </div>
      {failed && (
        <p role="alert" className="text-sm text-red-500">
          Couldn&apos;t change notifications. Please try again.
        </p>
      )}
    </section>
  );
}
