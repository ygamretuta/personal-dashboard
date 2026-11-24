import { describe, expect, it, vi } from "vitest";
import { createSlackClient, SlackApiError } from "./client";

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), init);

describe("Slack client", () => {
  it("sends the token and form-encoded params", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ ok: true, value: 1 }));
    const result = await createSlackClient("xoxp-1", { fetchImpl }).call<{ value: number }>(
      "auth.test",
      { a: "b", skip: undefined },
    );
    expect(result.value).toBe(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://slack.com/api/auth.test");
    expect(init.headers.Authorization).toBe("Bearer xoxp-1");
    expect(init.body.toString()).toBe("a=b");
  });

  it("throws a typed error when Slack answers ok: false", async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementation(async () => json({ ok: false, error: "invalid_auth" }));
    await expect(createSlackClient("t", { fetchImpl }).call("auth.test")).rejects.toMatchObject({
      code: "invalid_auth",
    });
    await expect(createSlackClient("t", { fetchImpl }).call("auth.test")).rejects.toBeInstanceOf(
      SlackApiError,
    );
  });

  it("waits for Retry-After and retries on HTTP 429", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ ok: false }, { status: 429, headers: { "Retry-After": "2" } }))
      .mockResolvedValueOnce(json({ ok: true }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await createSlackClient("t", { fetchImpl, sleep }).call("x");
    expect(sleep).toHaveBeenCalledWith(2000);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("gives up after repeated rate limiting", async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => json({ ok: false }, { status: 429 }));
    await expect(
      createSlackClient("t", { fetchImpl, sleep: async () => {} }).call("x"),
    ).rejects.toBeInstanceOf(SlackApiError);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });
});
