export interface Shortcut {
  keys: readonly string[]; // "Mod" means ⌘ on Mac and Ctrl elsewhere
  label: string;
}

/** The single source for keyboard handling, button hints, the palette and the `?` cheatsheet. */
export const SHORTCUTS = {
  next: { keys: ["j"], label: "Next item" },
  previous: { keys: ["k"], label: "Previous item" },
  openDetail: { keys: ["Enter"], label: "Open detail" },
  archive: { keys: ["e"], label: "Archive" },
  reply: { keys: ["r"], label: "Reply" },
  snooze: { keys: ["s"], label: "Snooze for 1 hour" },
  markRead: { keys: ["m"], label: "Mark as read" },
  openSource: { keys: ["o"], label: "Open in source app" },
  search: { keys: ["/"], label: "Search" },
  toggleUnread: { keys: ["u"], label: "Show unread only" },
  newEvent: { keys: ["c"], label: "New event (Calendar page)" },
  commandPalette: { keys: ["Mod", "k"], label: "Command palette" },
  cheatsheet: { keys: ["?"], label: "Show shortcuts" },
} as const satisfies Record<string, Shortcut>;

export type ShortcutId = keyof typeof SHORTCUTS;

const MODIFIER = "Mod";

export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  const [first, second] = shortcut.keys;
  const key = event.key.toLowerCase();
  if (first === MODIFIER) return (event.metaKey || event.ctrlKey) && key === second.toLowerCase();
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  return key === first.toLowerCase();
}

export function findShortcut(event: KeyboardEvent): ShortcutId | undefined {
  const ids = Object.keys(SHORTCUTS) as ShortcutId[];
  return ids.find((id) => matchesShortcut(event, SHORTCUTS[id]));
}
