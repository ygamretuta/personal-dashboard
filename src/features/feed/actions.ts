import type { ShortcutId } from "@/features/shortcuts/shortcuts";
import { SOURCE_CONFIG } from "./sources";
import type { ActionType, Source } from "./types";

interface ActionConfig {
  shortcut: ShortcutId;
  label: (source: Source) => string;
  failureMessage: string;
}

export const ACTION_CONFIG: Record<ActionType, ActionConfig> = {
  reply: { shortcut: "reply", label: () => "Reply", failureMessage: "Couldn't send your reply" },
  archive: {
    shortcut: "archive",
    label: (source) => SOURCE_CONFIG[source].archiveLabel,
    failureMessage: "Couldn't archive that item",
  },
  snooze: {
    shortcut: "snooze",
    label: () => "Snooze",
    failureMessage: "Couldn't snooze that item",
  },
  markRead: {
    shortcut: "markRead",
    label: () => "Mark read",
    failureMessage: "Couldn't mark that item as read",
  },
  open: {
    shortcut: "openSource",
    label: (source) => SOURCE_CONFIG[source].openLabel,
    failureMessage: "Couldn't open that item",
  },
};
