import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGithubOAuth } from "./oauth";

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), init);

beforeEach(() => {
  vi.stubEnv("GITHUB_CLIENT_ID", "gh-id");
  vi.stubEnv("GITHUB_CLIENT_SECRET", "gh-secret");
});

describe("GitHub OAuth", () => {
  it("requests notifications and repo scopes with a state", () => {
    const url = new URL(createGithubOAuth().buildAuthorizeUrl("st", "https://app.test/cb"));
    expect(url.searchParams.get("scope")).toBe("notifications repo");
    expect(url.searchParams.get("state")).toBe("st");
  });

  it("exchanges the code and identifies the account", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ access_token: "gho_abc", scope: "notifications,repo" }))
      .mockResolvedValueOnce(json({ id: 42, login: "octo" }));
    const tokens = await createGithubOAuth(fetchImpl).exchangeCode("code", "https://app.test/cb");
    expect(tokens).toMatchObject({
      externalAccountId: "42",
      accessToken: "gho_abc",
      scopes: ["notifications", "repo"],
    });
    expect(tokens.refreshToken).toBeUndefined();
  });

  it("surfaces GitHub's error when no token comes back", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(json({ error: "bad_verification_code" }));
    await expect(
      createGithubOAuth(fetchImpl).exchangeCode("code", "https://app.test/cb"),
    ).rejects.toThrow(/bad_verification_code/);
  });

  it("rejects a grant missing a required scope", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ access_token: "gho_abc", scope: "notifications" }));
    await expect(
      createGithubOAuth(fetchImpl).exchangeCode("code", "https://app.test/cb"),
    ).rejects.toThrow(/permission/);
  });
});
