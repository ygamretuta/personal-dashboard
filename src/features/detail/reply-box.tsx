"use client";

import { useState, type RefObject } from "react";
import { Kbd } from "@/components/ui/kbd";

interface ReplyBoxProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onSend: (text: string) => void;
}

export function ReplyBox({ textareaRef, onSend }: ReplyBoxProps) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") (event.target as HTMLElement).blur();
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send();
  };

  return (
    <div className="border-t border-border p-4">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
        placeholder="Write a reply…"
        aria-label="Reply"
        className="w-full resize-none rounded-md border border-border bg-panel p-2 text-sm"
      />
      <div className="mt-2 flex items-center justify-end gap-3 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Kbd keys={["Mod", "Enter"]} /> to send · <Kbd keys={["Escape"]} /> to leave
        </span>
        <button
          type="button"
          onClick={send}
          disabled={!text.trim()}
          className="btn btn-primary disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
