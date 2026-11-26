import { describe, expect, it } from "vitest";
import { mergeNewItems } from "./merge-items";
import { makeItem } from "./test-helpers";

describe("mergeNewItems", () => {
  it("adds unseen items and reports them as fresh", () => {
    const current = [makeItem({ id: "a" })];
    const { items, freshIds } = mergeNewItems(current, [
      makeItem({ id: "a" }),
      makeItem({ id: "b" }),
    ]);
    expect(items.map((item) => item.id)).toEqual(["b", "a"]);
    expect(freshIds).toEqual(["b"]);
  });

  it("keeps one copy when the same item arrives twice in one batch", () => {
    const { items, freshIds } = mergeNewItems([], [makeItem({ id: "d" }), makeItem({ id: "d" })]);
    expect(items.map((item) => item.id)).toEqual(["d"]);
    expect(freshIds).toEqual(["d"]);
  });
});
