import { RefreshCw, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Brief } from "./build-local-brief";

interface BriefCardProps {
  brief: Brief;
  loading?: boolean;
  isAi?: boolean;
  onRefresh?: () => void;
}

export function BriefCard({ brief, loading = false, isAi = false, onRefresh }: BriefCardProps) {
  return (
    <section
      aria-label="Daily brief"
      aria-busy={loading}
      className="mx-4 mb-2 rounded-lg border border-border bg-panel p-3"
    >
      <div className="flex items-center gap-1.5">
        <h2 className="flex flex-1 items-center gap-1.5 text-sm font-medium">
          <Sparkles size={14} className="text-primary" aria-hidden />
          {loading ? <Skeleton className="h-4 w-40" /> : brief.headline}
        </h2>
        {isAi && (
          <span className="rounded border border-border px-1 text-[10px] text-muted">AI</span>
        )}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh brief"
            className="rounded p-1 text-muted hover:bg-hover disabled:opacity-50"
          >
            <RefreshCw size={12} aria-hidden className={loading ? "animate-spin" : ""} />
          </button>
        )}
      </div>
      {loading ? (
        <div className="mt-2 space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ) : (
        brief.points.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 text-xs text-muted">
            {brief.points.map((point) => (
              <li key={point} className="truncate" title={point}>
                {point}
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
}
