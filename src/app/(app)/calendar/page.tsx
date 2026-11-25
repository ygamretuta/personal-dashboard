import { Suspense } from "react";
import { getCurrentUserId } from "@/adapters/auth";
import { CalendarView } from "@/features/calendar/calendar-view";

async function Calendar() {
  return <CalendarView live={Boolean(await getCurrentUserId())} />;
}

export default function CalendarPage() {
  return (
    <Suspense>
      <Calendar />
    </Suspense>
  );
}
