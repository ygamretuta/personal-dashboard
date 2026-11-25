"use client";

import { Activity, BarChart3, Clock3, Inbox, Sparkles } from "lucide-react";
import { SourceIcon } from "@/features/feed/components/source-icon";
import { SOURCE_CONFIG } from "@/features/feed/sources";
import { SOURCES, type Source } from "@/features/feed/types";
import type { InboxMode } from "@/features/inbox/use-inbox";
import { formatDuration } from "@/features/stats/format-duration";
import type { Stats } from "@/features/stats/summarize";
import { BarList } from "./charts/bar-list";
import { ColumnChart } from "./charts/column-chart";
import { Heatmap } from "./charts/heatmap";
import { Sparkline } from "./charts/sparkline";
import { greeting } from "./derive";
import { SOURCE_SERIES } from "./series";
import { useDashboard } from "./use-dashboard";
import { AgendaWidget } from "./widgets/agenda-widget";
import { AttentionWidget } from "./widgets/attention-widget";
import { ConnectionsWidget } from "./widgets/connections-widget";
import { DeploysWidget } from "./widgets/deploys-widget";
import { GithubWidget } from "./widgets/github-widget";
import { StatTile } from "./widgets/stat-tile";
import { TipsWidget } from "./widgets/tips-widget";
import { Widget, WidgetLink } from "./widgets/widget";

interface DashboardAppProps {
  mode: InboxMode;
  stats: Stats;
  connected: Source[];
}

const dateLabel = (now: number) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now);

const shortDay = (day: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(`${day}T12:00:00`),
  );

export function DashboardApp({ mode, stats, connected }: DashboardAppProps) {
  const dashboard = useDashboard(mode);
  const { now, brief } = dashboard;
  const inboxHref = mode === "demo" ? "/demo" : "/inbox";
  const nextMeeting =
    dashboard.agendaState.status === "ready"
      ? dashboard.agendaState.agenda.find(
          (entry) => entry.phase === "now" || entry.phase === "next",
        )
      : undefined;
  const meetingsToday =
    dashboard.agendaState.status === "ready" ? dashboard.agendaState.agenda.length : undefined;

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-4 p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted">{dateLabel(now)}</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {greeting(new Date(now).getHours())}
              {mode === "demo" && (
                <span className="ml-2 text-sm font-normal text-muted">demo data</span>
              )}
            </h1>
          </div>
          <a href={inboxHref} className="btn btn-primary">
            <Inbox size={14} aria-hidden /> Open inbox
          </a>
        </header>

        <section aria-label="Daily brief" className="rounded-xl border border-border bg-panel p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles size={14} className="text-primary" aria-hidden />
            {dashboard.loaded ? brief.brief.headline : "Reading your inbox…"}
            {brief.isAi && (
              <span className="rounded border border-border px-1 text-[10px] text-muted">AI</span>
            )}
          </h2>
          {dashboard.loaded && brief.brief.points.length > 0 && (
            <ul className="mt-2 grid gap-x-6 gap-y-1 text-sm text-muted md:grid-cols-2">
              {brief.brief.points.map((point) => (
                <li key={point} className="truncate" title={point}>
                  {point}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatTile
            label="Unread"
            value={dashboard.loaded ? String(dashboard.unreadTotal) : "–"}
            hint={dashboard.loaded ? `${dashboard.highPriority} high priority` : undefined}
          />
          <StatTile
            label="Meetings today"
            value={meetingsToday === undefined ? "–" : String(meetingsToday)}
            hint={
              nextMeeting
                ? `${nextMeeting.phase === "now" ? "Now" : "Next"}: ${nextMeeting.entry.title}`
                : "Nothing else scheduled"
            }
          />
          <StatTile
            label="Triaged, last 14 days"
            value={String(stats.total)}
            trend={
              <Sparkline
                values={stats.perDay.map((day) => day.count)}
                label="Items triaged per day, last 14 days"
              />
            }
          />
          <StatTile
            label="Day streak"
            value={String(stats.streakDays)}
            hint={`Median response ${formatDuration(stats.medianResponseMs)}`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-6 xl:grid-cols-12">
          <AttentionWidget
            items={dashboard.attention}
            now={now}
            inboxHref={inboxHref}
            className="lg:col-span-6 xl:col-span-5"
          />
          <AgendaWidget
            state={dashboard.agendaState}
            now={now}
            className="lg:col-span-3 xl:col-span-4"
          />
          <Widget title="Unread by source" icon={BarChart3} className="lg:col-span-3 xl:col-span-3">
            {dashboard.unreadPerSource ? (
              <BarList
                emptyText="Nothing unread."
                rows={SOURCES.map((source) => ({
                  key: source,
                  value: dashboard.unreadPerSource![source],
                  color: SOURCE_SERIES[source],
                  label: (
                    <>
                      <SourceIcon source={source} size={14} />
                      {SOURCE_CONFIG[source].label}
                    </>
                  ),
                }))}
              />
            ) : (
              <p className="text-sm text-muted">Loading…</p>
            )}
          </Widget>

          <Widget
            title="Triage activity"
            icon={Activity}
            className="lg:col-span-6 xl:col-span-5"
            action={<WidgetLink href="/stats">Details</WidgetLink>}
          >
            <ColumnChart
              label="Items triaged per day, last 14 days"
              unit="items"
              columns={stats.perDay.map((day) => ({
                key: day.day,
                axis: shortDay(day.day),
                title: shortDay(day.day),
                value: day.count,
              }))}
            />
          </Widget>
          <Widget title="When you triage" icon={Clock3} className="lg:col-span-6 xl:col-span-4">
            <Heatmap grid={stats.heatmap} unit="items" />
          </Widget>
          <DeploysWidget
            deployments={dashboard.deployments}
            now={now}
            className="lg:col-span-6 xl:col-span-3"
          />

          <GithubWidget
            summary={dashboard.github}
            now={now}
            inboxHref={inboxHref}
            className="lg:col-span-6 xl:col-span-5"
          />
          <ConnectionsWidget
            connected={connected}
            errors={dashboard.sourceErrors}
            className="lg:col-span-3 xl:col-span-4"
          />
          <TipsWidget className="lg:col-span-3 xl:col-span-3" />
        </div>
      </div>
    </div>
  );
}
