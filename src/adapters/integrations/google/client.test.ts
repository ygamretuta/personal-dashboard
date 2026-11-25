import { describe, expect, it, vi } from "vitest";
import { createGoogleClient, GoogleApiError } from "./client";

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), init);

describe("Google client", () => {
  it("sends the bearer token and repeated query params", async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => json({ ok: 1 }));
    await createGoogleClient("tok", { fetchImpl }).get("https://api.test/x", {
      q: "a b",
      h: ["From", "Subject"],
      skip: undefined,
    });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.test/x?q=a+b&h=From&h=Subject");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("posts JSON bodies", async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => json({}));
    await createGoogleClient("tok", { fetchImpl }).post("https://api.test/y", { a: 1 });
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: "POST", body: '{"a":1}' });
  });

  it("backs off and retries when rate limited", async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementationOnce(async () =>
        json({}, { status: 429, headers: { "Retry-After": "3" } }),
      )
      .mockImplementationOnce(async () => json({}, { status: 503 }))
      .mockImplementationOnce(async () => json({ done: true }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await createGoogleClient("t", { fetchImpl, sleep }).get<{ done: boolean }>(
      "https://api.test/z",
    );
    expect(result.done).toBe(true);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([3000, 2000]);
  });

  it("throws a typed error for other failures", async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => json({}, { status: 401 }));
    await expect(
      createGoogleClient("t", { fetchImpl }).get("https://api.test/a"),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      createGoogleClient("t", { fetchImpl }).get("https://api.test/a"),
    ).rejects.toBeInstanceOf(GoogleApiError);
  });
});

describe("Google client query params on POST", () => {
  it("adds query params to the URL of a POST", async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => json({}));
    await createGoogleClient("tok", { fetchImpl }).post("https://api.test/z", { a: 1 }, { v: 1 });
    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.test/z?v=1");
  });
});
