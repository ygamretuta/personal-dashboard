import { describe, expect, it } from "vitest";
import { normalizeGithubNotification, numberFromUrl } from "./normalize";
import type { GithubNotification } from "./types";

function notification(overrides: Partial<GithubNotification> = {}): GithubNotification {
  return {
    id: "9001",
    reason: "review_requested",
    unread: true,
    updated_at: "2026-11-24T08:00:00Z",
    subject: {
      title: "feat: encrypt OAuth tokens",
      url: "https://api.github.com/repos/acme/platform/pulls/142",
      latest_comment_url: null,
      type: "PullRequest",
    },
    repository: { full_name: "acme/platform" },
    ...overrides,
  };
}

const pull = {
  html_url: "https://github.com/acme/platform/pull/142",
  body: "Adds an encrypted token store.",
  user: { login: "marcus", avatar_url: "https://avatars.test/m.png" },
  additions: 184,
  deletions: 12,
  changed_files: 6,
};

describe("GitHub normalizer", () => {
  it("turns a review request into a high-priority review item", () => {
    const item = normalizeGithubNotification(notification(), { subject: pull });
    expect(item).toMatchObject({
      id: "github:9001",
      source: "github",
      kind: "review_request",
      title: "feat: encrypt OAuth tokens (#142)",
      priority: "high",
      status: "unread",
      sender: { name: "marcus", handle: "marcus", avatarUrl: "https://avatars.test/m.png" },
      url: "https://github.com/acme/platform/pull/142",
      receivedAt: "2026-11-24T08:00:00Z",
      actions: ["open", "archive", "snooze", "markRead"],
    });
    expect(item.body).toContain("marcus requested your review on acme/platform#142.");
    expect(item.body).toContain("+184 −12 across 6 files");
  });

  it("quotes the comment for a mention and links to it", () => {
    const comment = {
      html_url: "https://github.com/acme/platform/issues/131#issuecomment-1",
      body: "@you does focus trap differ on WebKit?",
      user: { login: "sam" },
    };
    const item = normalizeGithubNotification(
      notification({
        reason: "mention",
        subject: {
          title: "Flaky e2e",
          url: "https://api.github.com/repos/acme/platform/issues/131",
          latest_comment_url: "x",
          type: "Issue",
        },
      }),
      { comment },
    );
    expect(item).toMatchObject({
      kind: "issue",
      priority: "normal",
      url: comment.html_url,
      sender: { name: "sam" },
    });
    expect(item.body).toContain('"@you does focus trap differ on WebKit?"');
  });

  it("still produces a usable item when GitHub denies the details", () => {
    const item = normalizeGithubNotification(notification());
    expect(item.sender.name).toBe("Someone");
    expect(item.url).toBe("https://github.com/acme/platform");
    expect(item.body).toContain("requested your review on acme/platform#142");
  });

  it("keeps the preview short and the full text in the body", () => {
    const item = normalizeGithubNotification(notification(), {
      subject: { ...pull, body: "word ".repeat(200) },
    });
    expect(item.preview.length).toBeLessThanOrEqual(200);
    expect(item.body.length).toBeGreaterThan(200);
  });

  it("uses singular wording for a one-file change", () => {
    expect(
      normalizeGithubNotification(notification(), { subject: { ...pull, changed_files: 1 } }).body,
    ).toContain("across 1 file");
  });
});

describe("subject numbers", () => {
  it("reads the number from the API url", () => {
    expect(numberFromUrl("https://api.github.com/repos/a/b/pulls/7")).toBe("7");
    expect(numberFromUrl("https://api.github.com/repos/a/b")).toBeUndefined();
  });
});
