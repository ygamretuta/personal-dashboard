import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("shows a dash when there is nothing to measure", () => {
    expect(formatDuration(undefined)).toBe("—");
  });
  it("uses minutes under an hour, never below one", () => {
    expect(formatDuration(10_000)).toBe("1m");
    expect(formatDuration(45 * 60_000)).toBe("45m");
  });
  it("uses hours and minutes under a day", () => {
    expect(formatDuration(3 * 3_600_000 + 10 * 60_000)).toBe("3h 10m");
    expect(formatDuration(2 * 3_600_000)).toBe("2h");
  });
  it("uses days beyond that", () => {
    expect(formatDuration(2 * 86_400_000)).toBe("2d");
  });
});
