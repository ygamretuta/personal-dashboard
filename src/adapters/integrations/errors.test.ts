import { describe, expect, it } from "vitest";
import { classifyAdapterError, OAuthTokenError } from "./errors";
import { GithubApiError, GithubRateLimitError } from "./github/client";
import { GoogleApiError } from "./google/client";
import { SlackApiError } from "./slack/client";

describe("classifying adapter errors", () => {
  it("recognizes revoked or expired connections as needing reconnection", () => {
    expect(classifyAdapterError(new SlackApiError("search.messages", "token_revoked")).kind).toBe(
      "auth",
    );
    expect(classifyAdapterError(new GoogleApiError("u", 401)).kind).toBe("auth");
    expect(classifyAdapterError(new GithubApiError("u", 401)).kind).toBe("auth");
    expect(classifyAdapterError(new OAuthTokenError(400)).kind).toBe("auth");
  });

  it("recognizes rate limiting, and says how long GitHub's lasts", () => {
    expect(classifyAdapterError(new SlackApiError("x", "ratelimited")).kind).toBe("rate_limited");
    expect(classifyAdapterError(new GoogleApiError("u", 429)).kind).toBe("rate_limited");
    const now = 1_700_000_000_000;
    const github = new GithubRateLimitError("u", new Date(now + 90_000));
    expect(classifyAdapterError(github, now)).toEqual({
      kind: "rate_limited",
      retryAfterSeconds: 90,
    });
  });

  it("treats everything else as a plain failure", () => {
    expect(classifyAdapterError(new SlackApiError("x", "channel_not_found")).kind).toBe("failed");
    expect(classifyAdapterError(new GoogleApiError("u", 500)).kind).toBe("failed");
    expect(classifyAdapterError(new Error("boom")).kind).toBe("failed");
    expect(classifyAdapterError(undefined).kind).toBe("failed");
  });
});
