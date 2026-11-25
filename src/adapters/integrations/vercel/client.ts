const API_URL = "https://api.vercel.com";

export class VercelApiError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
  ) {
    super(`Vercel API ${status} for ${url}`);
  }
}

type Params = Record<string, string | number | undefined>;

export function createVercelClient(token: string, fetchImpl: typeof fetch = fetch) {
  return {
    async get<T>(path: string, params: Params = {}): Promise<T> {
      const url = new URL(`${API_URL}${path}`);
      for (const [key, value] of Object.entries(params))
        if (value !== undefined) url.searchParams.set(key, String(value));
      const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new VercelApiError(url.toString(), response.status);
      return (await response.json()) as T;
    },
  };
}

export type VercelClient = ReturnType<typeof createVercelClient>;
