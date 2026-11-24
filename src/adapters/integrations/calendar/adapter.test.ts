import { describe, expect, it, vi } from "vitest";
import type { GoogleClient } from "../google/client";
import type { ConnectedAccount } from "../types";
import { createCalendarAdapter } from "./adapter";

const account: ConnectedAccount = {
  id: "a",
  source: "calendar",
  externalAccountId: "1",
  accessToken: "tok",
};
const NOW = new Date("2026-11-24T09:00:00Z").getTime();

const timed = (id: string, extra = {}) => ({
  id,
  summary: id,
  htmlLink: "https://x",
  start: { dateTime: "2026-11-24T10:00:00Z" },
  end: { dateTime: "2026-11-24T11:00:00Z" },
  updated: "2026-11-20T00:00:00Z",
  ...extra,
});

function fakeClient(items: unknown[]) {
  const get = vi.fn(async () => ({ items }));
  return { client: { get, post: vi.fn() } as unknown as GoogleClient, get };
}

describe("Calendar adapter", () => {
  it("asks for the next 24 hours of expanded events and keeps only relevant ones", async () => {
    const { client, get } = fakeClient([
      timed("keep"),
      timed("gone", { status: "cancelled" }),
      timed("allday", { start: { date: "2026-11-24" } }),
    ]);
    const items = await createCalendarAdapter(
      () => client,
      () => NOW,
    ).fetchItems(account);
    expect(items.map((item) => item.id)).toEqual(["calendar:keep"]);
    expect(get).toHaveBeenCalledWith(expect.stringContaining("/calendars/primary/events"), {
      timeMin: "2026-11-24T07:00:00.000Z",
      timeMax: "2026-11-25T09:00:00.000Z",
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 25,
      updatedMin: undefined,
    });
  });

  it("only asks for changed events on later syncs", async () => {
    const { client, get } = fakeClient([]);
    const since = new Date("2026-11-24T08:00:00Z");
    await createCalendarAdapter(
      () => client,
      () => NOW,
    ).fetchItems(account, since);
    expect(get.mock.calls[0]).toMatchObject([
      expect.any(String),
      { updatedMin: since.toISOString() },
    ]);
  });

  it("never writes to the calendar", async () => {
    const { client } = fakeClient([]);
    const item = (
      await createCalendarAdapter(
        () => fakeClient([timed("x")]).client,
        () => NOW,
      ).fetchItems(account)
    )[0];
    await createCalendarAdapter(
      () => client,
      () => NOW,
    ).performAction(account, item, "snooze");
    expect(client.post).not.toHaveBeenCalled();
  });
});
