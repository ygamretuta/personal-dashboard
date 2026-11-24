import { ACTION_CONFIG } from "@/features/feed/actions";
import { SOURCE_CONFIG } from "@/features/feed/sources";
import { SOURCES, type ActionType, type FeedItem, type SourceFilter } from "@/features/feed/types";
import type { Command } from "@/features/shortcuts/command-palette";
import { SHORTCUTS } from "@/features/shortcuts/shortcuts";

interface CommandContext {
  selected?: FeedItem;
  runAction: (action: ActionType) => void;
  snoozeUntilTomorrow: () => void;
  setFilter: (filter: SourceFilter) => void;
  toggleTheme: () => void;
  showCheatsheet: () => void;
  goToSettings: () => void;
}

export function buildCommands(context: CommandContext): Command[] {
  const { selected } = context;
  const itemCommands: Command[] = (selected?.actions ?? []).map((action) => ({
    id: action,
    label: ACTION_CONFIG[action].label(selected!.source),
    keys: SHORTCUTS[ACTION_CONFIG[action].shortcut].keys,
    run: () => context.runAction(action),
  }));
  if (selected?.actions.includes("snooze")) {
    itemCommands.push({
      id: "snooze-tomorrow",
      label: "Snooze until tomorrow",
      run: context.snoozeUntilTomorrow,
    });
  }

  const filterCommands: Command[] = [
    { id: "filter-all", label: "Show all sources", run: () => context.setFilter("all") },
    ...SOURCES.map((source) => ({
      id: `filter-${source}`,
      label: `Show only ${SOURCE_CONFIG[source].label}`,
      run: () => context.setFilter(source),
    })),
  ];

  return [
    ...itemCommands,
    ...filterCommands,
    { id: "theme", label: "Toggle dark mode", run: context.toggleTheme },
    {
      id: "cheatsheet",
      label: "Show keyboard shortcuts",
      keys: SHORTCUTS.cheatsheet.keys,
      run: context.showCheatsheet,
    },
    { id: "settings", label: "Go to settings", run: context.goToSettings },
  ];
}
