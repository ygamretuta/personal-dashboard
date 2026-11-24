const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;
const RETRYABLE_STATUSES = [429, 503];

export class GoogleApiError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
  ) {
    super(`Google API ${status} for ${url}`);
  }
}

type Params = Record<string, string | number | boolean | string[] | undefined>;

interface ClientDeps {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function withParams(url: string, params: Params = {}): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    for (const entry of Array.isArray(value) ? value : [value]) query.append(key, String(entry));
  }
  const suffix = query.toString();
  return suffix ? `${url}?${suffix}` : url;
}

/** Tiny REST client shared by Gmail and Calendar, with backoff on rate limits (429/503). */
export function createGoogleClient(
  token: string,
  { fetchImpl = fetch, sleep = defaultSleep }: ClientDeps = {},
) {
  async function request<T>(
    method: "GET" | "POST",
    url: string,
    body?: unknown,
    attempt = 0,
  ): Promise<T> {
    const response = await fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (RETRYABLE_STATUSES.includes(response.status) && attempt < MAX_RETRIES) {
      const retryAfterMs = Number(response.headers.get("Retry-After")) * 1000;
      await sleep(retryAfterMs || BASE_BACKOFF_MS * 2 ** attempt);
      return request<T>(method, url, body, attempt + 1);
    }
    if (!response.ok) throw new GoogleApiError(url, response.status);
    return (await response.json()) as T;
  }

  return {
    get: <T>(url: string, params?: Params) => request<T>("GET", withParams(url, params)),
    post: <T>(url: string, body?: unknown) => request<T>("POST", url, body ?? {}),
  };
}

export type GoogleClient = ReturnType<typeof createGoogleClient>;
