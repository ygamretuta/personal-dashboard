"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/adapters/analytics";
import { ANALYTICS_EVENTS } from "@/adapters/analytics-events";
import { useToast } from "@/components/ui/toast";
import { createDemoAdapters, DEMO_ACCOUNTS } from "@/features/demo/demo-adapters";
import { useBrief } from "@/features/brief/use-brief";
import { useFeed } from "@/features/feed/use-feed";
import { unreadCounts, visibleItems } from "@/features/feed/visible-items";
import type { ActionType, FeedItem, SourceFilter } from "@/features/feed/types";
import { useKeyboardShortcuts } from "@/features/shortcuts/use-keyboard-shortcuts";
import { DEMO_SYNC_INTERVAL_MS, SNOOZE_TOMORROW_HOUR, SYNC_INTERVAL_MS } from "@/lib/constants";
import { useTheme } from "@/lib/use-theme";
import { buildCommands } from "./build-commands";
import { createRemoteAdapters, REMOTE_ACCOUNTS } from "./remote-adapters";

export type InboxMode = "demo" | "live";

export const MODE_CONFIG = {
  demo: {
    createAdapters: () => createDemoAdapters(),
    accounts: DEMO_ACCOUNTS,
    syncIntervalMs: DEMO_SYNC_INTERVAL_MS,
  },
  live: {
    createAdapters: createRemoteAdapters,
    accounts: REMOTE_ACCOUNTS,
    syncIntervalMs: SYNC_INTERVAL_MS,
  },
} as const;

type Overlay = "none" | "palette" | "cheatsheet";

function tomorrowMorning(now: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  date.setHours(SNOOZE_TOMORROW_HOUR, 0, 0, 0);
  return date.toISOString();
}

export function useInbox(mode: InboxMode) {
  const router = useRouter();
  const toast = useToast();
  const { toggleTheme } = useTheme();
  const { createAdapters, accounts, syncIntervalMs } = MODE_CONFIG[mode];
  const [adapters] = useState(createAdapters);
  const { items, freshIds, sourceErrors, loadFailed, retry, now, act } = useFeed({
    adapters,
    accounts,
    syncIntervalMs,
  });

  useEffect(() => {
    trackEvent(mode === "demo" ? ANALYTICS_EVENTS.DEMO_STARTED : ANALYTICS_EVENTS.INBOX_OPENED);
  }, [mode]);

  const [filter, setFilter] = useState<SourceFilter>("all");
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [requestedId, setRequestedId] = useState<string>();
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [detailOpen, setDetailOpen] = useState(false);
  const paneRef = useRef<HTMLElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const visible = useMemo(
    () => (items ? visibleItems(items, filter, now, { query, unreadOnly }) : null),
    [items, filter, now, query, unreadOnly],
  );
  const counts = useMemo(() => unreadCounts(items ?? [], now), [items, now]);
  const brief = useBrief(mode === "demo" ? "demo" : "live", items, now);

  const list = visible ?? [];
  const selectedIndex = Math.max(
    list.findIndex((item) => item.id === requestedId),
    0,
  );
  const selected: FeedItem | undefined = list[selectedIndex];

  const move = (offset: number) =>
    setRequestedId(list[Math.min(Math.max(selectedIndex + offset, 0), list.length - 1)]?.id);
  const selectItem = (id: string) => {
    setRequestedId(id);
    setDetailOpen(true);
  };

  const runAction = (action: ActionType, payload?: { text?: string; until?: string }) => {
    if (!selected) return;
    if (!selected.actions.includes(action))
      return toast.show(`${selected.sender.name}: that action isn't available here`);
    if (action === "open") window.open(selected.url, "_blank", "noopener");
    if (action === "reply" && !payload?.text) return replyRef.current?.focus();
    // Moving on after archive/snooze keeps the cursor where the user is working.
    const leavesList = action === "archive" || action === "snooze";
    if (leavesList) setRequestedId((list[selectedIndex + 1] ?? list[selectedIndex - 1])?.id);
    void act(selected, action, payload);
    if (action === "snooze") toast.show("Snoozed");
  };

  const openPalette = () => {
    trackEvent(ANALYTICS_EVENTS.COMMAND_PALETTE_OPENED);
    setOverlay("palette");
  };

  const snoozeUntilTomorrow = () => runAction("snooze", { until: tomorrowMorning(now) });

  const focusSearch = () => searchRef.current?.focus();
  const toggleUnread = () => setUnreadOnly((value) => !value);
  const clearSearch = () => {
    setQuery("");
    searchRef.current?.blur();
  };

  const openDetail = () => {
    setDetailOpen(true);
    if (selected?.status === "unread") void act(selected, "markRead");
    paneRef.current?.focus();
  };

  useKeyboardShortcuts(
    {
      next: () => move(1),
      previous: () => move(-1),
      openDetail,
      archive: () => runAction("archive"),
      reply: () => runAction("reply"),
      snooze: () => runAction("snooze"),
      markRead: () => runAction("markRead"),
      openSource: () => runAction("open"),
      search: focusSearch,
      toggleUnread,
      commandPalette: openPalette,
      cheatsheet: () => setOverlay("cheatsheet"),
    },
    overlay === "none",
  );

  // Refs are only read inside the command callbacks, never during render.
  // eslint-disable-next-line react-hooks/refs
  const commands = buildCommands({
    selected,
    runAction: (action) => runAction(action),
    snoozeUntilTomorrow,
    setFilter,
    unreadOnly,
    toggleUnread,
    focusSearch,
    toggleTheme,
    showCheatsheet: () => setOverlay("cheatsheet"),
    goToSettings: () => router.push("/settings"),
  });

  return {
    visible,
    sourceErrors,
    loadFailed,
    retry,
    counts,
    brief,
    selected,
    freshIds,
    now,
    filter,
    setFilter,
    query,
    setQuery,
    clearSearch,
    searchRef,
    unreadOnly,
    toggleUnread,
    narrowed: query.trim() !== "" || unreadOnly,
    selectItem,
    overlay,
    closeOverlay: () => setOverlay("none"),
    openPalette,
    detailOpen,
    closeDetail: () => setDetailOpen(false),
    paneRef,
    replyRef,
    runAction,
    commands,
  };
}
