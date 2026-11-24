import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_AGE_SECONDS = 5 * 60;

interface SignatureInput {
  signingSecret: string;
  timestamp: string | null;
  signature: string | null;
  body: string;
  nowSeconds?: number;
}

/** Verifies Slack's `v0` request signature and rejects replays older than five minutes. */
export function verifySlackSignature({
  signingSecret,
  timestamp,
  signature,
  body,
  nowSeconds = Date.now() / 1000,
}: SignatureInput): boolean {
  if (!timestamp || !signature) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > MAX_AGE_SECONDS) return false;

  const expected = `v0=${createHmac("sha256", signingSecret).update(`v0:${timestamp}:${body}`).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return (
    expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
