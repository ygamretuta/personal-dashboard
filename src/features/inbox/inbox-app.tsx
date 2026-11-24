"use client";

import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { BriefCard } from "@/features/brief/brief-card";
import { DetailPane } from "@/features/detail/detail-pane";
import { FeedList } from "@/features/feed/components/feed-list";
import { FilterChips } from "@/features/feed/components/filter-chips";
import { LoadFailed } from "@/features/feed/components/load-failed";
import { SyncBanner } from "@/features/feed/components/sync-banner";
import { CommandPalette } from "@/features/shortcuts/command-palette";
import { Cheatsheet } from "@/features/shortcuts/cheatsheet";
import { SHORTCUTS } from "@/features/shortcuts/shortcuts";
import { useInbox, type InboxMode } from "./use-inbox";

export function InboxApp({ mode }: { mode: InboxMode }) {
  const inbox = useInbox(mode);
  const { selected, detailOpen } = inbox;

  return (
    <div className="flex min-h-0 flex-1">
      <div
        className={`flex w-full flex-col border-r border-border bg-panel md:w-[380px] md:shrink-0 ${detailOpen ? "hidden md:flex" : "flex"}`}
      >
        <div className="flex items-center justify-between px-4 pt-3">
          <h1 className="text-sm font-semibold">{mode === "demo" ? "Inbox · demo" : "Inbox"}</h1>
          <button type="button" onClick={inbox.openPalette} className="btn text-muted">
            <Search size={12} aria-hidden /> Search commands{" "}
            <Kbd keys={SHORTCUTS.commandPalette.keys} />
          </button>
        </div>
        <FilterChips value={inbox.filter} counts={inbox.counts} onChange={inbox.setFilter} />
        <SyncBanner errors={inbox.sourceErrors} />
        {inbox.visible && (
          <BriefCard
            brief={inbox.brief.brief}
            loading={inbox.brief.loading}
            isAi={inbox.brief.isAi}
            onRefresh={inbox.brief.refresh}
          />
        )}
        {inbox.loadFailed ? (
          <LoadFailed onRetry={inbox.retry} />
        ) : (
          <FeedList
            items={inbox.visible}
            selectedId={selected?.id}
            freshIds={inbox.freshIds}
            now={inbox.now}
            onSelect={inbox.selectItem}
          />
        )}
        <p className="border-t border-border px-4 py-2 text-xs text-muted">
          <Kbd keys={["j"]} /> <Kbd keys={["k"]} /> move · <Kbd keys={["?"]} /> shortcuts
        </p>
      </div>

      <div className={`min-w-0 flex-1 bg-background ${detailOpen ? "flex" : "hidden md:flex"}`}>
        <DetailPane
          item={selected}
          paneRef={inbox.paneRef}
          replyRef={inbox.replyRef}
          onAction={(action, text) => inbox.runAction(action, text ? { text } : undefined)}
          onBack={inbox.closeDetail}
        />
      </div>

      {inbox.overlay === "palette" && (
        <CommandPalette commands={inbox.commands} onClose={inbox.closeOverlay} />
      )}
      {inbox.overlay === "cheatsheet" && <Cheatsheet onClose={inbox.closeOverlay} />}
    </div>
  );
}
