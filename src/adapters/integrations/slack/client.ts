const SLACK_API_URL = "https://slack.com/api";
const MAX_RETRIES = 3;
const DEFAULT_RETRY_AFTER_SECONDS = 1;

export class SlackApiError extends Error {
  constructor(
    readonly method: string,
    readonly code: string,
  ) {
    super(`Slack ${method} failed: ${code}`);
  }
}

type Params = Record<string, string | number | boolean | undefined>;

interface ClientDeps {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Minimal Slack Web API client with rate-limit backoff (honors Retry-After on HTTP 429). */
export function createSlackClient(
  token: string,
  { fetchImpl = fetch, sleep = defaultSleep }: ClientDeps = {},
) {
  async function call<T>(method: string, params: Params = {}, attempt = 0): Promise<T> {
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
      if (value !== undefined) body.set(key, String(value));

    const response = await fetchImpl(`${SLACK_API_URL}/${method}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = Number(response.headers.get("Retry-After")) || DEFAULT_RETRY_AFTER_SECONDS;
      await sleep(retryAfter * 1000);
      return call<T>(method, params, attempt + 1);
    }

    const data = (await response.json()) as { ok: boolean; error?: string } & T;
    if (!data.ok) throw new SlackApiError(method, data.error ?? `http_${response.status}`);
    return data;
  }

  return { call };
}

export type SlackClient = ReturnType<typeof createSlackClient>;
