import { Dialog } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { SHORTCUTS } from "./shortcuts";

export function Cheatsheet({ onClose }: { onClose: () => void }) {
  return (
    <Dialog label="Keyboard shortcuts" onClose={onClose}>
      <h2 className="border-b border-border px-4 py-3 text-sm font-medium">Keyboard shortcuts</h2>
      <ul className="divide-y divide-border">
        {Object.values(SHORTCUTS).map((shortcut) => (
          <li key={shortcut.label} className="flex items-center justify-between px-4 py-2 text-sm">
            <span>{shortcut.label}</span>
            <Kbd keys={shortcut.keys} />
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
