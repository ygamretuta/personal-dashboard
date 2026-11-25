import { describe, expect, it } from "vitest";
import { isCommitId, normalizeGithubCommit } from "./normalize-commit";
import type { GithubCommit } from "./types";

const commit: GithubCommit = {
  sha: "abcdef1234567890",
  html_url: "https://github.com/acme/app/commit/abcdef1234567890",
  commit: {
    message: "Fix token refresh\n\nRefresh a minute early to avoid races.",
    committer: { name: "Sam Cho", date: "2026-11-24T08:00:00Z" },
  },
  author: { login: "samcho", avatar_url: "https://avatars.test/s.png" },
};

describe("normalizeGithubCommit", () => {
  it("turns another person's commit into an unread feed item", () => {
    const item = normalizeGithubCommit(commit, "acme/app", "me");
    expect(item).toMatchObject({
      id: "github:commit:acme/app:abcdef1234567890",
      kind: "commit",
      title: "Fix token refresh (acme/app@abcdef1)",
      sender: { name: "samcho", handle: "samcho" },
      url: commit.html_url,
      receivedAt: "2026-11-24T08:00:00Z",
      priority: "normal",
      status: "unread",
    });
    expect(item.body).toContain("Refresh a minute early");
    expect(item.preview).toContain("samcho:");
  });

  it("marks your own commits as read and low priority", () => {
    const item = normalizeGithubCommit(commit, "acme/app", "samcho");
    expect(item).toMatchObject({ priority: "low", status: "read" });
  });

  it("falls back to the committer name when the email has no GitHub account", () => {
    const item = normalizeGithubCommit({ ...commit, author: null }, "acme/app", "me");
    expect(item.sender).toEqual({ name: "Sam Cho", avatarUrl: undefined, handle: undefined });
  });

  it("recognises commit ids", () => {
    expect(isCommitId("commit:acme/app:abc")).toBe(true);
    expect(isCommitId("9001")).toBe(false);
  });
});
