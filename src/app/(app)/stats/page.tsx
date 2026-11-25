import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUserId } from "@/adapters/auth";
import { getStats } from "@/features/stats/server/stats-service";
import { StatsView } from "@/features/stats/stats-view";

const SIGN_IN_URL = "/api/auth/signin?callbackUrl=%2Fstats";

async function Stats() {
  const userId = await getCurrentUserId();
  if (!userId) redirect(SIGN_IN_URL);
  return <StatsView stats={await getStats(userId)} />;
}

export default function StatsPage() {
  return (
    <Suspense>
      <Stats />
    </Suspense>
  );
}
