import { Suspense } from "react";
import { getCurrentUserId } from "@/adapters/auth";
import { DashboardApp } from "@/features/dashboard/dashboard-app";
import { demoStats } from "@/features/dashboard/demo-stats";
import { SOURCES } from "@/features/feed/types";
import { listConnectedSources } from "@/features/integrations/server/accounts";
import { getStats } from "@/features/stats/server/stats-service";

async function Dashboard() {
  const userId = await getCurrentUserId();
  if (!userId)
    return <DashboardApp mode="demo" stats={demoStats(new Date())} connected={SOURCES} />;
  const [stats, connected] = await Promise.all([getStats(userId), listConnectedSources(userId)]);
  return <DashboardApp mode="live" stats={stats} connected={connected} />;
}

export default function DashboardPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
