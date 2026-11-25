import { describe, expect, it, vi } from "vitest";
import type { ConnectedAccount } from "../types";
import { createVercelAdapter } from "./adapter";
import { VercelApiError, type VercelClient } from "./client";
import { vercelToken } from "./token";
import type { VercelDeployment } from "./types";

const account: ConnectedAccount = {
  id: "a",
  source: "vercel",
  externalAccountId: "u",
  accessToken: "t",
};
const NOW = Date.parse("2026-11-25T09:00:00Z");

const dpl = (
  uid: string,
  state: string,
  target: string | null = "production",
): VercelDeployment => ({
  uid,
  name: "app",
  url: `${uid}.vercel.app`,
  state,
  target,
  created: NOW - 60_000,
});

function client(handler: (path: string, params: Record<string, unknown>) => unknown) {
  const get = vi.fn(async (path: string, params: Record<string, unknown> = {}) =>
    handler(path, params),
  );
  return { client: { get } as unknown as VercelClient, get };
}

describe("Vercel adapter", () => {
  it("collects relevant deployments from the personal scope and every team", async () => {
    const { client: fake, get } = client((path, params) => {
      if (path === "/v2/teams") return { teams: [{ id: "team_1", slug: "acme" }] };
      return {
        deployments: params.teamId
          ? [dpl("t1", "ERROR")]
          : [dpl("p1", "READY"), dpl("p2", "BUILDING")],
      };
    });
    const items = await createVercelAdapter(
      () => fake,
      () => NOW,
    ).fetchItems(account);
    expect(items.map((item) => item.externalId).sort()).toEqual(["deployment:p1", "deployment:t1"]);
    expect(get).toHaveBeenCalledWith(
      "/v6/deployments",
      expect.objectContaining({ teamId: "team_1" }),
    );
  });

  it("only asks for deployments since the last sync, defaulting to two days", async () => {
    const { client: fake, get } = client((path) =>
      path === "/v2/teams" ? {} : { deployments: [] },
    );
    const adapter = createVercelAdapter(
      () => fake,
      () => NOW,
    );
    await adapter.fetchItems(account);
    await adapter.fetchItems(account, new Date(NOW - 1000));
    const sinces = get.mock.calls
      .filter(([path]) => path === "/v6/deployments")
      .map(([, p]) => p?.since);
    expect(sinces).toEqual([NOW - 2 * 86_400_000, NOW - 1000]);
  });

  it("skips a team it cannot read but surfaces other errors", async () => {
    const forbidden = client((path, params) => {
      if (path === "/v2/teams") return { teams: [{ id: "t", slug: "locked" }] };
      if (params.teamId) throw new VercelApiError("u", 403);
      return { deployments: [dpl("p1", "ERROR")] };
    });
    const items = await createVercelAdapter(
      () => forbidden.client,
      () => NOW,
    ).fetchItems(account);
    expect(items).toHaveLength(1);

    const broken = client(() => {
      throw new VercelApiError("u", 500);
    });
    await expect(createVercelAdapter(() => broken.client).fetchItems(account)).rejects.toThrow(
      "500",
    );
  });

  it("keeps every action local to the app", async () => {
    await expect(
      createVercelAdapter().performAction(account, {} as never, "archive"),
    ).resolves.toBeUndefined();
  });
});

describe("Vercel token provider", () => {
  it("accepts a token Vercel recognises and returns the account id", async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ user: { id: "u_9", username: "me" } })),
    );
    vi.stubGlobal("fetch", fetchImpl);
    const tokens = await vercelToken.verify("secret");
    vi.unstubAllGlobals();
    expect(tokens).toEqual({ externalAccountId: "u_9", accessToken: "secret", scopes: [] });
  });

  it("rejects a token Vercel refuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 403 })),
    );
    await expect(vercelToken.verify("bad")).rejects.toThrow("403");
    vi.unstubAllGlobals();
  });
});
