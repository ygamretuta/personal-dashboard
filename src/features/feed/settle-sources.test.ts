import { describe, expect, it } from "vitest";
import { allSourcesFailed, settleSources } from "./settle-sources";
import { SourceSyncError } from "./sync-errors";
import { SOURCES } from "./types";
import { makeItem } from "./test-helpers";

const ok = (...ids: string[]): PromiseFulfilledResult<ReturnType<typeof makeItem>[]> => ({
  status: "fulfilled",
  value: ids.map((id) => makeItem({ id })),
});
const failed = (reason: unknown): PromiseRejectedResult => ({ status: "rejected", reason });

describe("settling source results", () => {
  it("keeps items from healthy sources when another fails", () => {
    const { items, errors } = settleSources([
      ok("a"),
      failed(new SourceSyncError("auth")),
      ok("b"),
      failed(new Error("boom")),
      ok(),
    ]);
    expect(items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(errors).toEqual({ gmail: "auth", github: "failed" });
  });

  it("treats unknown errors as plain failures", () => {
    expect(settleSources([failed("x"), ok(), ok(), ok(), ok()]).errors).toEqual({
      slack: "failed",
    });
  });

  it("knows when nothing could be loaded", () => {
    const everyFailure = settleSources(SOURCES.map((source) => failed(source)));
    expect(allSourcesFailed(everyFailure.errors)).toBe(true);
    expect(allSourcesFailed(settleSources([ok(), failed(1), ok(), ok(), ok()]).errors)).toBe(false);
  });
});
