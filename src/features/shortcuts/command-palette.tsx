"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

export interface Command {
  id: string;
  label: string;
  keys?: readonly string[];
  run: () => void;
}

export function CommandPalette({
  commands,
  onClose,
}: {
  commands: Command[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const matches = commands.filter((command) =>
    command.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const activeIndex = Math.min(active, Math.max(matches.length - 1, 0));

  const run = (command: Command | undefined) => {
    if (!command) return;
    onClose();
    command.run();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") setActive(Math.min(activeIndex + 1, matches.length - 1));
    else if (event.key === "ArrowUp") setActive(Math.max(activeIndex - 1, 0));
    else if (event.key === "Enter") run(matches[activeIndex]);
    else return;
    event.preventDefault();
  };

  return (
    <Dialog label="Command palette" onClose={onClose} align="top">
      <input
        autoFocus
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        placeholder="Type a command…"
        aria-label="Search commands"
        className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none"
      />
      <ul role="listbox" className="max-h-72 overflow-y-auto p-1">
        {matches.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted">No matching commands</li>
        )}
        {matches.map((command, index) => (
          <li
            key={command.id}
            role="option"
            aria-selected={index === activeIndex}
            onMouseMove={() => setActive(index)}
            onClick={() => run(command)}
            className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm ${index === activeIndex ? "bg-selected" : ""}`}
          >
            <span>{command.label}</span>
            {command.keys && <Kbd keys={command.keys} />}
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
