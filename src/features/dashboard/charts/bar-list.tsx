import type { ReactNode } from "react";

export interface BarRow {
  key: string;
  label: ReactNode;
  value: number;
  color: string;
}

/** Horizontal bars sorted by value. Every bar carries its number and name, so color is never the only cue. */
export function BarList({ rows, emptyText }: { rows: BarRow[]; emptyText: string }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...sorted.map((row) => row.value));
  if (sorted.every((row) => row.value === 0))
    return <p className="text-sm text-muted">{emptyText}</p>;

  return (
    <ul className="space-y-2.5">
      {sorted.map((row) => (
        <li key={row.key}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">{row.label}</span>
            <span className="tabular-nums">{row.value}</span>
          </div>
          <div className="h-2 rounded-full bg-hover">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(row.value / max) * 100}%`,
                minWidth: row.value ? 8 : 0,
                background: row.color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
