export class SentryApiError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
  ) {
    super(`Sentry API ${status} for ${url}`);
  }
}

type Params = Record<string, string | number | string[] | undefined>;

/** Sentry's US and EU data regions are separate hosts; an account only exists in one. */
export const SENTRY_REGIONS = {
  us: "https://sentry.io",
  eu: "https://de.sentry.io",
} as const;

export type SentryRegion = keyof typeof SENTRY_REGIONS;

export const isRegion = (value: string): value is SentryRegion => value in SENTRY_REGIONS;

/** Organization slugs only ever contain these characters; this keeps a crafted slug out of the URL path. */
export const isOrgSlug = (value: string) => /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(value);

export function createSentryClient(
  token: string,
  region: SentryRegion,
  fetchImpl: typeof fetch = fetch,
) {
  return {
    async get<T>(path: string, params: Params = {}): Promise<T> {
      const url = new URL(`/api/0${path}`, SENTRY_REGIONS[region]);
      for (const [key, value] of Object.entries(params))
        for (const entry of Array.isArray(value) ? value : value === undefined ? [] : [value])
          url.searchParams.append(key, String(entry));
      const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new SentryApiError(url.toString(), response.status);
      return (await response.json()) as T;
    },
  };
}

export type SentryClient = ReturnType<typeof createSentryClient>;

/** An account id is `<region>:<organization slug>`. */
export function parseAccountId(externalAccountId: string): { region: SentryRegion; org: string } {
  const [region, ...rest] = externalAccountId.split(":");
  const org = rest.join(":");
  if (!isRegion(region) || !isOrgSlug(org)) throw new Error("Invalid Sentry account");
  return { region, org };
}
