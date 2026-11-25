import { SOURCE_CONFIG } from "@/features/feed/sources";
import type { Source } from "@/features/feed/types";
import { formatDuration } from "./format-duration";
import type { Stats } from "./summarize";
import { STATS_WINDOW_DAYS } from "./summarize";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function DayBars({ perDay }: { perDay: Stats["perDay"] }) {
  const max = Math.max(1, ...perDay.map((day) => day.count));
  return (
    <ul aria-label="Items triaged per day" className="flex h-28 items-end gap-1">
      {perDay.map(({ day, count }) => (
        <li
          key={day}
          className="flex h-full flex-1 flex-col justify-end"
          title={`${day}: ${count}`}
        >
          <div
            className="rounded-sm bg-primary"
            style={{ height: `${(count / max) * 100}%`, minHeight: count ? 4 : 1 }}
          />
          <span className="sr-only">
            {day}: {count}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Breakdown({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort(([, a], [, b]) => b - a);
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-muted">Nothing yet.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {entries.map(([key, count]) => (
            <li key={key} className="flex justify-between">
              <span>{key in SOURCE_CONFIG ? SOURCE_CONFIG[key as Source].label : key}</span>
              <span className="tabular-nums text-muted">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function StatsView({ stats }: { stats: Stats }) {
  return (
    <div className="mx-auto w-full max-w-xl space-y-8 overflow-y-auto p-8">
      <h1 className="text-xl font-semibold">Stats</h1>
      <p className="text-sm text-muted">
        What you triaged in the last {STATS_WINDOW_DAYS} days. Opening a link doesn&apos;t count.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Triaged" value={String(stats.total)} />
        <Tile label="Median response" value={formatDuration(stats.medianResponseMs)} />
        <Tile label="Day streak" value={String(stats.streakDays)} />
      </div>
      <section className="space-y-2">
        <h2 className="text-sm font-medium">Per day</h2>
        <DayBars perDay={stats.perDay} />
      </section>
      <div className="grid gap-8 sm:grid-cols-2">
        <Breakdown title="By source" counts={stats.bySource} />
        <Breakdown title="By action" counts={stats.byAction} />
      </div>
    </div>
  );
}
