import { Keyboard } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { SHORTCUTS, type ShortcutId } from "@/features/shortcuts/shortcuts";
import { Widget } from "./widget";

const TIPS: ShortcutId[] = ["next", "archive", "snooze", "search", "commandPalette", "cheatsheet"];

export function TipsWidget({ className }: { className?: string }) {
  return (
    <Widget title="Keyboard shortcuts" icon={Keyboard} className={className}>
      <ul className="space-y-1.5">
        {TIPS.map((id) => (
          <li key={id} className="flex items-center justify-between text-sm">
            <span className="text-muted">{SHORTCUTS[id].label}</span>
            <Kbd keys={id === "next" ? ["j", "k"] : SHORTCUTS[id].keys} />
          </li>
        ))}
      </ul>
    </Widget>
  );
}
