const KEY_LABELS: Record<string, string> = { Mod: "⌘", Enter: "↵", Escape: "Esc" };

export function Kbd({ keys }: { keys: readonly string[] }) {
  return (
    <span className="inline-flex gap-1">
      {keys.map((key) => (
        <kbd
          key={key}
          className="min-w-5 rounded border border-border bg-hover px-1 text-center font-mono text-[11px] leading-5 text-muted"
        >
          {KEY_LABELS[key] ?? key}
        </kbd>
      ))}
    </span>
  );
}
