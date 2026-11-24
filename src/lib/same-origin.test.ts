import { describe, expect, it } from "vitest";
import { isSameOrigin } from "./same-origin";

const request = (headers: Record<string, string>) =>
  new Request("https://app.test/api/actions", { method: "POST", headers });

describe("same-origin check", () => {
  it("accepts requests from our own origin", () => {
    expect(isSameOrigin(request({ origin: "https://app.test", host: "app.test" }))).toBe(true);
  });

  it("accepts the configured public URL behind a proxy", () => {
    expect(
      isSameOrigin(
        request({ origin: "https://morning.example", host: "internal:3000" }),
        "https://morning.example",
      ),
    ).toBe(true);
  });

  it("rejects another site's origin", () => {
    expect(isSameOrigin(request({ origin: "https://evil.test", host: "app.test" }))).toBe(false);
  });

  it("rejects a malformed origin", () => {
    expect(isSameOrigin(request({ origin: "null", host: "app.test" }))).toBe(false);
  });

  it("without an Origin header, trusts only non-cross-site requests", () => {
    expect(isSameOrigin(request({ host: "app.test" }))).toBe(true);
    expect(isSameOrigin(request({ "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(isSameOrigin(request({ "sec-fetch-site": "cross-site" }))).toBe(false);
  });
});
