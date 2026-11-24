import { describe, expect, it } from "vitest";
import { scrubSentryEvent } from "./sentry-scrub";

describe("Sentry scrubbing", () => {
  it("drops OAuth query params, cookies and credential headers", () => {
    const event = scrubSentryEvent({
      request: {
        url: "https://app.test/api/integrations/slack/callback?code=SECRET&state=abc",
        query_string: "code=SECRET",
        cookies: { session: "x" },
        headers: {
          Authorization: "Bearer t",
          Cookie: "a=b",
          "X-Slack-Signature": "v0=1",
          Accept: "*/*",
        },
      },
    });
    expect(event.request).toEqual({
      url: "https://app.test/api/integrations/slack/callback",
      headers: { Accept: "*/*" },
    });
  });

  it("leaves events without a request alone", () => {
    expect(scrubSentryEvent({})).toEqual({});
  });
});
