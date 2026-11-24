import { TIME } from "./constants";

const REFRESH_MARGIN_MS = TIME.MINUTE_MS;

/** True when a token expires within the next minute (or already has). Tokens without an expiry never refresh. */
export function needsRefresh(
  expiresAt: Date | null | undefined,
  now: number = Date.now(),
): boolean {
  return Boolean(expiresAt) && expiresAt!.getTime() - now < REFRESH_MARGIN_MS;
}
