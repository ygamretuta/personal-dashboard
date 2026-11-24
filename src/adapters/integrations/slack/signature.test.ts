import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifySlackSignature } from "./signature";

const secret = "shhh";
const body = '{"type":"event_callback"}';
const now = 1_700_000_000;
const sign = (timestamp: number) =>
  `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex")}`;

describe("Slack signature verification", () => {
  it("accepts a correctly signed, fresh request", () => {
    expect(
      verifySlackSignature({
        signingSecret: secret,
        timestamp: String(now),
        signature: sign(now),
        body,
        nowSeconds: now,
      }),
    ).toBe(true);
  });

  it("rejects a wrong signature", () => {
    expect(
      verifySlackSignature({
        signingSecret: secret,
        timestamp: String(now),
        signature: "v0=bad",
        body,
        nowSeconds: now,
      }),
    ).toBe(false);
  });

  it("rejects a tampered body", () => {
    expect(
      verifySlackSignature({
        signingSecret: secret,
        timestamp: String(now),
        signature: sign(now),
        body: body + " ",
        nowSeconds: now,
      }),
    ).toBe(false);
  });

  it("rejects a replayed old request", () => {
    expect(
      verifySlackSignature({
        signingSecret: secret,
        timestamp: String(now - 600),
        signature: sign(now - 600),
        body,
        nowSeconds: now,
      }),
    ).toBe(false);
  });

  it("rejects missing headers", () => {
    expect(
      verifySlackSignature({
        signingSecret: secret,
        timestamp: null,
        signature: null,
        body,
        nowSeconds: now,
      }),
    ).toBe(false);
  });
});
