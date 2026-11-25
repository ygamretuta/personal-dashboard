import type { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  /** Optional trend drawn under the number. */
  trend?: ReactNode;
}

export function StatTile({ label, value, hint, trend }: StatTileProps) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-border bg-panel p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-muted">{hint}</p>}
      {trend && <div className="mt-2">{trend}</div>}
    </div>
  );
}
