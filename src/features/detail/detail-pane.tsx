import type { RefObject } from "react";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/kbd";
import { ACTION_CONFIG } from "@/features/feed/actions";
import { SourceIcon } from "@/features/feed/components/source-icon";
import { SOURCE_CONFIG } from "@/features/feed/sources";
import type { ActionType, FeedItem } from "@/features/feed/types";
import { SHORTCUTS } from "@/features/shortcuts/shortcuts";
import { ReplyBox } from "./reply-box";

interface DetailPaneProps {
  item?: FeedItem;
  paneRef: RefObject<HTMLElement | null>;
  replyRef: RefObject<HTMLTextAreaElement | null>;
  onAction: (action: ActionType, text?: string) => void;
  onBack: () => void;
}

const BAR_ACTIONS: ActionType[] = ["open", "archive", "snooze", "markRead"];

function ActionBar({ item, onAction }: { item: FeedItem; onAction: DetailPaneProps["onAction"] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {BAR_ACTIONS.filter((action) => item.actions.includes(action)).map((action) => (
        <button key={action} type="button" onClick={() => onAction(action)} className="btn">
          {ACTION_CONFIG[action].label(item.source)}
          <Kbd keys={SHORTCUTS[ACTION_CONFIG[action].shortcut].keys} />
        </button>
      ))}
    </div>
  );
}

export function DetailPane({ item, paneRef, replyRef, onAction, onBack }: DetailPaneProps) {
  if (!item) {
    return (
      <section
        ref={paneRef}
        tabIndex={-1}
        className="flex flex-1 items-center justify-center text-sm text-muted"
      >
        Select an item to read it
      </section>
    );
  }

  return (
    <section
      ref={paneRef}
      tabIndex={-1}
      aria-label="Item detail"
      className="animate-fade-in flex min-w-0 flex-1 flex-col outline-none"
      key={item.id}
    >
      <header className="space-y-3 border-b border-border p-4">
        <button type="button" onClick={onBack} className="btn md:hidden">
          <ArrowLeft size={14} aria-hidden /> Back
        </button>
        <div className="flex items-start gap-3">
          <Avatar name={item.sender.name} size={36} />
          <div className="min-w-0">
            <h1 className="text-base font-semibold">{item.title}</h1>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <SourceIcon source={item.source} size={12} />
              {item.sender.name} · {SOURCE_CONFIG[item.source].label}
              {item.sender.handle && ` · ${item.sender.handle}`}
            </p>
          </div>
        </div>
        <ActionBar item={item} onAction={onAction} />
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm leading-relaxed">
        <p className="whitespace-pre-wrap">{item.body}</p>
        {item.replies.map((reply) => (
          <div
            key={reply.id}
            className="animate-slide-in rounded-md border border-border bg-selected p-3"
          >
            <p className="mb-1 text-xs text-muted">You replied</p>
            <p className="whitespace-pre-wrap">{reply.text}</p>
          </div>
        ))}
      </div>

      {item.actions.includes("reply") && (
        <ReplyBox key={item.id} textareaRef={replyRef} onSend={(text) => onAction("reply", text)} />
      )}
    </section>
  );
}
