import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./crypto";

const key = randomBytes(32).toString("base64");

describe("token encryption", () => {
  it("round-trips a secret", () => {
    expect(decrypt(encrypt("xoxp-secret", key), key)).toBe("xoxp-secret");
  });

  it("produces different ciphertext each time", () => {
    expect(encrypt("same", key)).not.toBe(encrypt("same", key));
  });

  it("does not contain the plaintext", () => {
    expect(encrypt("xoxp-secret", key)).not.toContain("xoxp-secret");
  });

  it("rejects tampered data", () => {
    const [iv, tag, data] = encrypt("secret", key).split(".");
    const tampered = [iv, tag, Buffer.from("x" + data).toString("base64")].join(".");
    expect(() => decrypt(tampered, key)).toThrow();
  });

  it("rejects a key of the wrong size", () => {
    expect(() => encrypt("secret", "c2hvcnQ=")).toThrow(/32 bytes/);
  });
});
