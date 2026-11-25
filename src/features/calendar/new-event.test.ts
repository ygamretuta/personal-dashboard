import { describe, expect, it } from "vitest";
import { newEventSchema } from "./new-event";

const valid = {
  title: "Sync",
  start: "2026-11-26T09:00:00.000Z",
  end: "2026-11-26T09:30:00.000Z",
  timeZone: "UTC",
};

describe("newEventSchema", () => {
  it("accepts a minimal event and defaults guests and Meet", () => {
    expect(newEventSchema.parse(valid)).toMatchObject({ guests: [], addMeet: false });
  });
  it("requires a title", () => {
    expect(newEventSchema.safeParse({ ...valid, title: "  " }).success).toBe(false);
  });
  it("rejects an event that ends before it starts", () => {
    expect(newEventSchema.safeParse({ ...valid, end: valid.start }).success).toBe(false);
  });
  it("rejects invalid guest emails", () => {
    expect(newEventSchema.safeParse({ ...valid, guests: ["nope"] }).success).toBe(false);
  });
});
