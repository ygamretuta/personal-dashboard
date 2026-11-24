"use client";

import { useEffect, type ReactNode } from "react";

interface DialogProps {
  label: string;
  onClose: () => void;
  children: ReactNode;
  align?: "top" | "center";
}

export function Dialog({ label, onClose, children, align = "center" }: DialogProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const alignment = align === "top" ? "items-start pt-[15vh]" : "items-center";

  return (
    <div
      className={`animate-fade-in fixed inset-0 z-40 flex justify-center bg-black/40 p-4 ${alignment}`}
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-panel shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
