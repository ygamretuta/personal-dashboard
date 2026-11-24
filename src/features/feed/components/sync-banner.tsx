import { SYNC_ERROR_CONFIG, type SyncErrorKind } from "../sync-errors";
import type { Source } from "../types";

interface SyncBannerProps {
  errors: Partial<Record<Source, SyncErrorKind>>;
}

export function SyncBanner({ errors }: SyncBannerProps) {
  const entries = Object.entries(errors) as [Source, SyncErrorKind][];
  if (entries.length === 0) return null;

  return (
    <div
      role="status"
      className="mx-4 mb-2 space-y-1 rounded-lg border border-amber-500/40 bg-panel p-2 text-xs"
    >
      {entries.map(([source, kind]) => {
        const { message, action } = SYNC_ERROR_CONFIG[kind];
        return (
          <p key={source} className="flex items-center gap-2">
            <span className="flex-1">{message(source)}</span>
            {action && (
              <a href={action.href} className="text-primary underline">
                {action.label}
              </a>
            )}
          </p>
        );
      })}
    </div>
  );
}
