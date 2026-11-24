"use client";

import { useEffect, useRef } from "react";
import { findShortcut, type ShortcutId } from "./shortcuts";

type Handlers = Partial<Record<ShortcutId, () => void>>;

const TEXT_INPUT_SELECTOR = "input, textarea, select, [contenteditable='true']";

function isTyping(event: KeyboardEvent): boolean {
  return event.target instanceof Element && event.target.matches(TEXT_INPUT_SELECTOR);
}

export function useKeyboardShortcuts(handlers: Handlers, enabled: boolean): void {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const id = findShortcut(event);
      if (!id) return;
      const isModified = event.metaKey || event.ctrlKey;
      if (isTyping(event) && !isModified) return;
      const handler = handlersRef.current[id];
      if (!handler) return;
      event.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
