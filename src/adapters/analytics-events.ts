/** Every tracked event, named in business terms. Add new events here, never inline. */
export const ANALYTICS_EVENTS = {
  DEMO_STARTED: "demo_started",
  INBOX_OPENED: "inbox_opened",
  ITEM_ACTION_PERFORMED: "item_action_performed",
  COMMAND_PALETTE_OPENED: "command_palette_opened",
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
