const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;

export const TIME = { SECOND_MS, MINUTE_MS, HOUR_MS, DAY_MS: 24 * HOUR_MS } as const;

/** How often real integrations are polled when push (webhooks) is unavailable. */
export const SYNC_INTERVAL_MS = 5 * MINUTE_MS;
/** Demo mode syncs fast so new items visibly slide in. */
export const DEMO_SYNC_INTERVAL_MS = 15 * SECOND_MS;
export const DEMO_LATENCY_MS = 250;
export const CLOCK_TICK_MS = 30 * SECOND_MS;

export const SNOOZE_DEFAULT_MS = HOUR_MS;
export const SNOOZE_TOMORROW_HOUR = 9;

export const PREVIEW_MAX_CHARS = 200;
export const TOAST_DURATION_MS = 4000;
export const THEME_STORAGE_KEY = "theme";
