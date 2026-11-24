const API_URL = "https://api.github.com";
const API_VERSION = "2022-11-28";
const MAX_RETRIES = 3;
const MAX_PAGES = 3;
const DEFAULT_PAGE_SIZE = 50;

export class GithubApiError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
  ) {
    super(`GitHub API ${status} for ${url}`);
  }
}

/** The hourly quota is used up; waiting would take too long, so the sync fails and retries later. */
export class GithubRateLimitError extends GithubApiError {
  constructor(
    url: string,
    readonly resetAt: Date,
  ) {
    super(url, 403);
    this.message = `GitHub rate limit reached until ${resetAt.toISOString()}`;
  }
}

type Params = Record<string, string | number | boolean | undefined>;

interface ClientDeps {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function toUrl(path: string, params: Params = {}): string {
  const url = new URL(path.startsWith("http") ? path : `${API_URL}${path}`);
  for (const [key, value] of Object.entries(params))
    if (value !== undefined) url.searchParams.set(key, String(value));
  return url.toString();
}

const nextPageUrl = (response: Response) =>
  response.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1];

export function createGithubClient(
  token: string,
  { fetchImpl = fetch, sleep = defaultSleep }: ClientDeps = {},
) {
  async function request(method: string, url: string, attempt = 0): Promise<Response> {
    const response = await fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": API_VERSION,
      },
    });

    if (response.status === 429 || response.status === 403) {
      const retryAfter = Number(response.headers.get("retry-after"));
      // Secondary (abuse) limits tell us how long to wait.
      if (retryAfter && attempt < MAX_RETRIES) {
        await sleep(retryAfter * 1000);
        return request(method, url, attempt + 1);
      }
      if (response.headers.get("x-ratelimit-remaining") === "0") {
        throw new GithubRateLimitError(
          url,
          new Date(Number(response.headers.get("x-ratelimit-reset")) * 1000),
        );
      }
    }
    if (!response.ok) throw new GithubApiError(url, response.status);
    return response;
  }

  return {
    async get<T>(path: string, params?: Params): Promise<T> {
      return (await request("GET", toUrl(path, params))).json() as Promise<T>;
    },

    /** Follows `Link: rel="next"` pages (up to a cap) so callers never paginate. */
    async getAll<T>(path: string, params?: Params): Promise<T[]> {
      const items: T[] = [];
      let url: string | undefined = toUrl(path, { per_page: DEFAULT_PAGE_SIZE, ...params });
      for (let page = 0; url && page < MAX_PAGES; page++) {
        const response = await request("GET", url);
        items.push(...((await response.json()) as T[]));
        url = nextPageUrl(response);
      }
      return items;
    },

    /** For endpoints that answer with no body (204/205). */
    async send(method: "PATCH" | "DELETE", path: string): Promise<void> {
      await request(method, toUrl(path));
    },
  };
}

export type GithubClient = ReturnType<typeof createGithubClient>;
