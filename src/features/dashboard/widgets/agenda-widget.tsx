import { CalendarDays, Video } from "lucide-react";
import type { AgendaEntry } from "../derive";
import { EmptyNote, Widget, WidgetLink } from "./widget";

export type AgendaState =
  | { status: "loading" }
  | { status: "ready"; agenda: AgendaEntry[] }
  | { status: "unavailable"; reason: "not_connected" | "needs_reconnect" | "failed" };

const time = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));

const PHASE_STYLE = {
  past: "opacity-50",
  now: "border-l-2 border-primary bg-selected",
  next: "border-l-2 border-primary/50",
  later: "border-l-2 border-transparent",
} as const;

function minutesUntil(iso: string, now: number) {
  const minutes = Math.max(0, Math.round((new Date(iso).getTime() - now) / 60_000));
  return minutes < 60 ? `in ${minutes}m` : `in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function AgendaWidget({
  state,
  now,
  className,
}: {
  state: AgendaState;
  now: number;
  className?: string;
}) {
  return (
    <Widget
      title="Today"
      icon={CalendarDays}
      className={className}
      action={<WidgetLink href="/calendar">Calendar</WidgetLink>}
    >
      {state.status === "loading" && <EmptyNote>Loading…</EmptyNote>}
      {state.status === "unavailable" && (
        <EmptyNote>
          {state.reason === "failed"
            ? "Couldn't load your calendar."
            : "Google Calendar needs to be connected."}{" "}
          {state.reason !== "failed" && (
            <a className="underline" href="/settings">
              Open settings
            </a>
          )}
        </EmptyNote>
      )}
      {state.status === "ready" &&
        (state.agenda.length === 0 ? (
          <EmptyNote>No meetings today. Deep work time.</EmptyNote>
        ) : (
          <ol className="space-y-1.5">
            {state.agenda.map(({ entry, phase }) => (
              <li key={entry.id} className={`rounded-md py-1.5 pl-3 pr-2 ${PHASE_STYLE[phase]}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">{entry.title}</p>
                  <p className="shrink-0 text-xs tabular-nums text-muted">{time(entry.start)}</p>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  {phase === "now" && (
                    <span className="font-medium text-primary">Happening now</span>
                  )}
                  {phase === "next" && (
                    <span className="font-medium text-primary">
                      Next · {minutesUntil(entry.start, now)}
                    </span>
                  )}
                  {entry.location && <span className="truncate">{entry.location}</span>}
                  {entry.meetUrl && (
                    <a
                      href={entry.meetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1 underline"
                    >
                      <Video size={11} aria-hidden /> Join
                    </a>
                  )}
                </p>
              </li>
            ))}
          </ol>
        ))}
    </Widget>
  );
}
