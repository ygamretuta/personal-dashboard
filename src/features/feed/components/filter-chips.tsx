import { SOURCE_CONFIG } from "../sources";
import { SOURCES, type Source, type SourceFilter } from "../types";

interface FilterChipsProps {
  value: SourceFilter;
  counts: Record<Source | "all", number>;
  onChange: (filter: SourceFilter) => void;
}

const FILTERS: SourceFilter[] = ["all", ...SOURCES];

export function FilterChips({ value, counts, onChange }: FilterChipsProps) {
  return (
    <div role="group" aria-label="Filter by source" className="flex flex-wrap gap-1.5 px-4 py-2">
      {FILTERS.map((filter) => {
        const active = filter === value;
        const label = filter === "all" ? "All" : SOURCE_CONFIG[filter].label;
        return (
          <button
            key={filter}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter)}
            className={`rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap transition-colors ${
              active
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border hover:bg-hover"
            }`}
          >
            {label}
            {counts[filter] > 0 && <span className="ml-1 opacity-70">{counts[filter]}</span>}
          </button>
        );
      })}
    </div>
  );
}
