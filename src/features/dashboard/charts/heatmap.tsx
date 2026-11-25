"use client";

import { useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABELS = new Set([0, 6, 12, 18]);
const MIN_INTENSITY = 10;

const hourName = (hour: number) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(new Date(2000, 0, 1, hour));
/** "12 AM" is too wide for a grid column, so axis labels use "12a", "6p". */
const axisName = (hour: number) => hourName(hour).replace(" AM", "a").replace(" PM", "p");

/** Weekday by hour grid; one blue hue from light to dark. The caption below reports the hovered or focused cell. */
export function Heatmap({ grid, unit }: { grid: number[][]; unit: string }) {
  const [active, setActive] = useState<{ day: number; hour: number }>();
  const max = Math.max(1, ...grid.flat());
  const caption = active
    ? `${WEEKDAYS[active.day]} ${hourName(active.hour)}: ${grid[active.day][active.hour]} ${unit}`
    : "Hover a cell for details";

  return (
    <figure aria-label={`When you triage, by weekday and hour (${unit})`}>
      <div className="grid grid-cols-[2rem_1fr] gap-x-2 gap-y-[3px] text-[11px] text-muted">
        <span />
        <div aria-hidden className="grid grid-cols-24">
          {grid[0].map((_, hour) => (
            <span key={hour} className="whitespace-nowrap">
              {HOUR_LABELS.has(hour) ? axisName(hour) : ""}
            </span>
          ))}
        </div>
        {grid.map((row, day) => (
          <div key={WEEKDAYS[day]} className="contents">
            <span className="leading-4">{WEEKDAYS[day]}</span>
            <div className="grid grid-cols-24 gap-[3px]" onMouseLeave={() => setActive(undefined)}>
              {row.map((value, hour) => (
                <div
                  key={hour}
                  tabIndex={0}
                  role="img"
                  aria-label={`${WEEKDAYS[day]} ${hourName(hour)}: ${value} ${unit}`}
                  onMouseEnter={() => setActive({ day, hour })}
                  onFocus={() => setActive({ day, hour })}
                  onBlur={() => setActive(undefined)}
                  className="aspect-square rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{
                    background: value
                      ? `color-mix(in srgb, var(--chart-sequence) ${MIN_INTENSITY + (value / max) * (100 - MIN_INTENSITY)}%, transparent)`
                      : "var(--hover)",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex items-center justify-between text-xs text-muted">
        <span aria-live="polite">{caption}</span>
        <span className="flex items-center gap-1.5">
          Less
          <span
            aria-hidden
            className="h-2 w-16 rounded-full"
            style={{
              background: `linear-gradient(to right, color-mix(in srgb, var(--chart-sequence) ${MIN_INTENSITY}%, transparent), var(--chart-sequence))`,
            }}
          />
          More
        </span>
      </figcaption>
    </figure>
  );
}
