interface ScrubbableEvent {
  request?: {
    url?: string;
    query_string?: unknown;
    cookies?: unknown;
    headers?: Record<string, string>;
  };
}

const SENSITIVE_HEADERS = ["authorization", "cookie", "x-slack-signature"];

/** Removes what must never reach Sentry: OAuth codes/state in URLs, cookies and credentials in headers. */
export function scrubSentryEvent<T extends ScrubbableEvent>(event: T): T {
  const { request } = event;
  if (!request) return event;

  if (request.url) request.url = request.url.split("?")[0];
  delete request.query_string;
  delete request.cookies;
  if (request.headers) {
    for (const name of Object.keys(request.headers)) {
      if (SENSITIVE_HEADERS.includes(name.toLowerCase())) delete request.headers[name];
    }
  }
  return event;
}
