import { describe, expect, it } from "vitest";
import { formatRelative } from "./format-time";

const NOW = new Date("2026-11-23T09:00:00Z").getTime();
const minutesFromNow = (minutes: number) => new Date(NOW + minutes * 60_000).toISOString();

describe("relative time", () => {
  it("formats the past", () => {
    expect(formatRelative(minutesFromNow(-5), NOW)).toBe("5m");
    expect(formatRelative(minutesFromNow(-180), NOW)).toBe("3h");
    expect(formatRelative(minutesFromNow(-3000), NOW)).toBe("2d");
  });

  it("formats upcoming events", () => {
    expect(formatRelative(minutesFromNow(25), NOW)).toBe("in 25m");
  });

  it("says now for the current minute", () => {
    expect(formatRelative(minutesFromNow(0), NOW)).toBe("now");
  });
});
