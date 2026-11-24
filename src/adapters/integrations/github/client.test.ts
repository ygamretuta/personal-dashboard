import { describe, expect, it, vi } from "vitest";
import { createGithubClient, GithubApiError, GithubRateLimitError } from "./client";

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), init);
const empty = (status: number) => new Response(null, { status });

describe("GitHub client", () => {
  it("sends the token, API version and query params", async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => json({ ok: 1 }));
    await createGithubClient("gho_1", { fetchImpl }).get("/notifications", {
      participating: true,
      skip: undefined,
    });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.github.com/notifications?participating=true");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer gho_1",
      "X-GitHub-Api-Version": "2022-11-28",
    });
  });

  it("follows Link headers across pages, up to a cap", async () => {
    const page = (items: number[], next?: string) =>
      json(
        items,
        next ? { headers: { link: `<${next}>; rel="next", <https://x/last>; rel="last"` } } : {},
      );
    const fetchImpl = vi
      .fn()
      .mockImplementationOnce(async () => page([1, 2], "https://api.github.com/p2"))
      .mockImplementationOnce(async () => page([3], "https://api.github.com/p3"))
      .mockImplementationOnce(async () => page([4], "https://api.github.com/p4"))
      .mockImplementationOnce(async () => page([5]));
    const items = await createGithubClient("t", { fetchImpl }).getAll<number>("/notifications");
    expect(items).toEqual([1, 2, 3, 4]);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("waits for Retry-After on secondary rate limits", async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementationOnce(async () =>
        json({}, { status: 403, headers: { "retry-after": "5" } }),
      )
      .mockImplementationOnce(async () => json({ done: true }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await createGithubClient("t", { fetchImpl, sleep }).get("/x");
    expect(sleep).toHaveBeenCalledWith(5000);
  });

  it("fails fast when the hourly quota is used up", async () => {
    const reset = Math.floor(Date.now() / 1000) + 1800;
    const fetchImpl = vi.fn().mockImplementation(async () =>
      json(
        {},
        {
          status: 403,
          headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": String(reset) },
        },
      ),
    );
    const sleep = vi.fn();
    const error = await createGithubClient("t", { fetchImpl, sleep })
      .get("/x")
      .catch((e) => e);
    expect(error).toBeInstanceOf(GithubRateLimitError);
    expect((error as GithubRateLimitError).resetAt).toEqual(new Date(reset * 1000));
    expect(sleep).not.toHaveBeenCalled();
  });

  it("throws a typed error for other failures and accepts empty responses", async () => {
    const failing = vi.fn().mockImplementation(async () => empty(404));
    await expect(createGithubClient("t", { fetchImpl: failing }).get("/x")).rejects.toMatchObject({
      status: 404,
    });
    await expect(createGithubClient("t", { fetchImpl: failing }).get("/x")).rejects.toBeInstanceOf(
      GithubApiError,
    );
    const ok = vi.fn().mockImplementation(async () => empty(204));
    await expect(
      createGithubClient("t", { fetchImpl: ok }).send("DELETE", "/notifications/threads/1"),
    ).resolves.toBeUndefined();
  });
});
