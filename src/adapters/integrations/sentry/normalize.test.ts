import { describe, expect, it } from "vitest";
import { normalizeSentryIssue } from "./normalize";
import type { SentryIssue } from "./types";

const issue = (overrides: Partial<SentryIssue> = {}): SentryIssue => ({
  id: "42",
  shortId: "APP-7",
  title: "TypeError: x is undefined",
  culprit: "refresh(accounts.ts)",
  level: "error",
  count: "1234",
  userCount: 1,
  firstSeen: "2026-11-25T01:00:00Z",
  lastSeen: "2026-11-25T08:30:00Z",
  permalink: "https://acme.sentry.io/issues/42/",
  project: { id: "9", slug: "app", name: "App" },
  metadata: { value: "x is undefined" },
  ...overrides,
});

describe("normalizeSentryIssue", () => {
  it("turns an issue into an unread error item with counts in the body", () => {
    const item = normalizeSentryIssue(issue());
    expect(item).toMatchObject({
      id: "sentry:issue:42",
      kind: "error",
      source: "sentry",
      title: "TypeError: x is undefined",
      sender: { name: "App", handle: "APP-7" },
      url: "https://acme.sentry.io/issues/42/",
      receivedAt: "2026-11-25T08:30:00Z",
      priority: "high",
      status: "unread",
    });
    expect(item.body).toContain("1,234 events · 1 user affected");
    expect(item.body).toContain("Culprit: refresh(accounts.ts)");
    expect(item.preview).toContain("app:");
  });

  it("maps severity to priority", () => {
    const priority = (level: string) => normalizeSentryIssue(issue({ level })).priority;
    expect([priority("fatal"), priority("error"), priority("warning"), priority("info")]).toEqual([
      "high",
      "high",
      "normal",
      "low",
    ]);
  });

  it("copes with missing culprit and metadata", () => {
    const item = normalizeSentryIssue(issue({ culprit: undefined, metadata: undefined }));
    expect(item.body).not.toContain("Culprit");
  });
});
