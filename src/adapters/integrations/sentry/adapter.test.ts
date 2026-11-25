import { describe, expect, it, vi } from "vitest";
import type { ConnectedAccount } from "../types";
import { createSentryAdapter, selectedProjectIds } from "./adapter";
import { parseAccountId, SentryApiError, type SentryClient } from "./client";
import { sentryToken } from "./token";
import type { SentryIssue } from "./types";

const account = (overrides: Partial<ConnectedAccount> = {}): ConnectedAccount => ({
  id: "a",
  source: "sentry",
  externalAccountId: "eu:acme",
  accessToken: "tok",
  ...overrides,
});

const issue = {
  id: "1",
  shortId: "A-1",
  title: "Boom",
  level: "error",
  count: "3",
  userCount: 1,
  firstSeen: "x",
  lastSeen: "2026-11-25T08:00:00Z",
  permalink: "https://s/1",
  project: { id: "9", slug: "a", name: "A" },
} as SentryIssue;

function fake(result: unknown) {
  const get = vi.fn<(path: string, params?: Record<string, unknown>) => Promise<unknown>>(
    async () => result,
  );
  const factory = vi.fn(() => ({ get }) as unknown as SentryClient);
  return { get, factory };
}

describe("Sentry adapter", () => {
  it("asks the organization's issues endpoint on the account's region for unresolved issues in the last day", async () => {
    const { get, factory } = fake([issue]);
    const items = await createSentryAdapter(factory).fetchItems(account());
    expect(factory).toHaveBeenCalledWith("tok", "eu");
    expect(get).toHaveBeenCalledWith(
      "/organizations/acme/issues/",
      expect.objectContaining({ query: "is:unresolved", statsPeriod: "24h" }),
    );
    expect(items.map((item) => item.id)).toEqual(["sentry:issue:1"]);
  });

  it("limits the request to the projects picked in Settings", async () => {
    const { get, factory } = fake([]);
    await createSentryAdapter(factory).fetchItems(account({ settings: { projectIds: ["9", 12] } }));
    expect(get.mock.calls[0][1]).toMatchObject({ project: ["9", "12"] });
  });

  it("asks for every project when none were picked", async () => {
    const { get, factory } = fake([]);
    await createSentryAdapter(factory).fetchItems(account());
    expect(get.mock.calls[0][1]?.project).toBeUndefined();
    expect(selectedProjectIds({ projectIds: [] })).toBeUndefined();
  });

  it("is read-only: actions do nothing", async () => {
    await expect(
      createSentryAdapter().performAction(account(), {} as never, "archive"),
    ).resolves.toBeUndefined();
  });

  it("rejects a malformed account id", () => {
    expect(() => parseAccountId("mars:acme")).toThrow();
    expect(() => parseAccountId("us:../etc")).toThrow();
    expect(parseAccountId("us:my-org")).toEqual({ region: "us", org: "my-org" });
  });
});

describe("Sentry token provider", () => {
  it("checks the organization with the token and stores region and slug as the account id", async () => {
    const fetchImpl = vi.fn<(url: URL) => Promise<Response>>(async () => new Response("{}"));
    vi.stubGlobal("fetch", fetchImpl);
    const tokens = await sentryToken.verify("secret", { org: "Acme", region: "eu" });
    vi.unstubAllGlobals();
    expect(String(fetchImpl.mock.calls[0][0])).toBe(
      "https://de.sentry.io/api/0/organizations/acme/",
    );
    expect(tokens).toEqual({ externalAccountId: "eu:acme", accessToken: "secret", scopes: [] });
  });

  it("refuses odd organization slugs without calling Sentry", async () => {
    const fetchImpl = vi.fn();
    vi.stubGlobal("fetch", fetchImpl);
    await expect(sentryToken.verify("t", { org: "a/b", region: "us" })).rejects.toThrow();
    vi.unstubAllGlobals();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a token Sentry refuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 401 })),
    );
    await expect(sentryToken.verify("bad", { org: "acme", region: "us" })).rejects.toThrow(
      SentryApiError,
    );
    vi.unstubAllGlobals();
  });
});
