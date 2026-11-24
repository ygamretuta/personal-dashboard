import { randomBytes } from "node:crypto";

const STATE_COOKIE_PREFIX = "oauth_state_";
const STATE_BYTES = 24;
const STATE_MAX_AGE_SECONDS = 600;

export const stateCookieName = (source: string) => `${STATE_COOKIE_PREFIX}${source}`;
export const createState = () => randomBytes(STATE_BYTES).toString("hex");
export const stateCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: STATE_MAX_AGE_SECONDS,
  path: "/",
};

/** The origin used in OAuth redirect URIs; set APP_URL when behind a tunnel or proxy. */
export const appOrigin = (request: Request) => process.env.APP_URL ?? new URL(request.url).origin;
