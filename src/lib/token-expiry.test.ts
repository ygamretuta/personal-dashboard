import { describe, expect, it } from "vitest";
import { needsRefresh } from "./token-expiry";

const NOW = 1_700_000_000_000;

describe("token refresh timing", () => {
  it("refreshes tokens that are expired or about to expire", () => {
    expect(needsRefresh(new Date(NOW - 1000), NOW)).toBe(true);
    expect(needsRefresh(new Date(NOW + 30_000), NOW)).toBe(true);
  });

  it("keeps tokens with time left", () => {
    expect(needsRefresh(new Date(NOW + 10 * 60_000), NOW)).toBe(false);
  });

  it("never refreshes tokens that do not expire", () => {
    expect(needsRefresh(null, NOW)).toBe(false);
    expect(needsRefresh(undefined, NOW)).toBe(false);
  });
});
