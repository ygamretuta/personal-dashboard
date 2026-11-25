"use client";

import { useState } from "react";

export interface Column {
  key: string;
  /** Short axis label, shown for a few columns only. */
  axis: string;
  /** Full description for the tooltip and the table view. */
  title: string;
  value: number;
}

interface ColumnChartProps {
  columns: Column[];
  unit: string;
  label: string;
}

const CHART_HEIGHT_PX = 140;
const GRID_LINES = [0.25, 0.5, 0.75, 1];

/** Vertical bars with a hover/focus tooltip and a screen-reader table; the axis labels first, middle and last. */
export function ColumnChart({ columns, unit, label }: ColumnChartProps) {
  const [active, setActive] = useState<number>();
  const max = Math.max(1, ...columns.map((column) => column.value));

  return (
    <figure aria-label={label} className="relative">
      <div className="relative" style={{ height: CHART_HEIGHT_PX }}>
        {GRID_LINES.map((fraction) => (
          <div
            key={fraction}
            aria-hidden
            className="absolute inset-x-0 border-t border-border/60"
            style={{ bottom: `${fraction * 100}%` }}
          />
        ))}
        <div
          className="absolute inset-0 flex items-end gap-1"
          onMouseLeave={() => setActive(undefined)}
        >
          {columns.map((column, index) => (
            <div
              key={column.key}
              tabIndex={0}
              role="img"
              aria-label={`${column.title}: ${column.value} ${unit}`}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(undefined)}
              className="group relative flex h-full flex-1 items-end outline-none"
            >
              <div
                className="w-full rounded-t-[4px] bg-chart-sequence transition-opacity"
                style={{
                  height: `${(column.value / max) * 100}%`,
                  minHeight: column.value ? 3 : 1,
                  opacity: active === undefined || active === index ? 1 : 0.45,
                }}
              />
              {active === index && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-panel px-2 py-1 text-xs shadow-md"
                >
                  <span className="text-muted">{column.title}</span>{" "}
                  <span className="font-medium tabular-nums">{column.value}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden className="mt-1 flex justify-between text-[11px] text-muted">
        {[columns[0], columns[Math.floor(columns.length / 2)], columns.at(-1)].map((column) => (
          <span key={column?.key}>{column?.axis}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {columns.map((column) => (
            <tr key={column.key}>
              <th scope="row">{column.title}</th>
              <td>{column.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
