const SAFE_FETCH_SITES = ["same-origin", "none"];

/**
 * CSRF guard for state-changing routes (on top of SameSite=Lax cookies).
 * Browsers always send Origin on cross-site POSTs; a mismatch is rejected.
 * Requests without Origin (scripts, curl) must still carry the session cookie, and are refused if the browser says cross-site.
 */
export function isSameOrigin(
  request: Request,
  appUrl: string | undefined = process.env.APP_URL,
): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    const site = request.headers.get("sec-fetch-site");
    return !site || SAFE_FETCH_SITES.includes(site);
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const allowedHosts = [
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
    appUrl && new URL(appUrl).host,
  ];
  return allowedHosts.includes(originHost);
}
