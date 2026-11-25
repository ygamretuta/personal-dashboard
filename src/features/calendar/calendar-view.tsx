"use client";

import { useState } from "react";
import { CalendarApp } from "./calendar-app";
import { createDemoCalendar, createRemoteCalendar } from "./calendar-source";

/** Signed-in visitors get their Google Calendar; everyone else gets an in-memory demo. */
export function CalendarView({ live }: { live: boolean }) {
  const [source] = useState(() => (live ? createRemoteCalendar() : createDemoCalendar()));
  return <CalendarApp source={source} demo={!live} />;
}
