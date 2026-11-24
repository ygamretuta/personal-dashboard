import { describe, expect, it } from "vitest";
import { localDateKey } from "./local-date";

const LATE_UTC = new Date("2026-11-24T02:00:00Z");

describe("local date key", () => {
  it("uses the viewer's day, not UTC's", () => {
    expect(localDateKey(LATE_UTC, "America/Los_Angeles")).toBe("2026-11-23");
    expect(localDateKey(LATE_UTC, "Asia/Manila")).toBe("2026-11-24");
  });

  it("falls back to UTC for a bad zone", () => {
    expect(localDateKey(LATE_UTC, "Not/AZone")).toBe("2026-11-24");
  });
});
