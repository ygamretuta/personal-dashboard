import posthog from "posthog-js";
import type { AnalyticsEvent } from "./analytics-events";

type EventProperties = Record<string, string | number | boolean>;

const isEnabled = (): boolean =>
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "production" &&
  Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

export function initAnalytics(): void {
  if (!isEnabled() || posthog.__loaded) return;
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: "history_change",
    person_profiles: "identified_only",
  });
}

export function trackEvent(event: AnalyticsEvent, properties?: EventProperties): void {
  if (!isEnabled()) return;
  posthog.capture(event, properties);
}

/** Identify by internal ID only; never emails or names. */
export function identifyUser(userId: string): void {
  if (!isEnabled()) return;
  posthog.identify(userId);
}

export function resetUser(): void {
  if (!isEnabled()) return;
  posthog.reset();
}

export function isFeatureEnabled(flag: string): boolean {
  if (!isEnabled()) return false;
  return posthog.isFeatureEnabled(flag) ?? false;
}
