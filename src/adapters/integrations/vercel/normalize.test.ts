import { describe, expect, it } from "vitest";
import { isRelevantDeployment, normalizeDeployment } from "./normalize";
import type { VercelDeployment } from "./types";

const deployment = (overrides: Partial<VercelDeployment> = {}): VercelDeployment => ({
  uid: "dpl_1",
  name: "personal-dashboard",
  url: "personal-dashboard-abc.vercel.app",
  state: "ERROR",
  target: "production",
  created: Date.parse("2026-11-25T08:00:00Z"),
  inspectorUrl: "https://vercel.com/team/personal-dashboard/dpl_1",
  creator: { username: "marcus" },
  meta: {
    githubCommitMessage: "fix: retry",
    githubCommitRef: "main",
    githubCommitSha: "4d2e9c1abc",
  },
  ...overrides,
});

describe("Vercel deployments", () => {
  it("surfaces failures and production successes, and ignores everything else", () => {
    expect(isRelevantDeployment(deployment())).toBe(true);
    expect(isRelevantDeployment(deployment({ state: "READY" }))).toBe(true);
    expect(isRelevantDeployment(deployment({ state: "READY", target: null }))).toBe(false);
    expect(isRelevantDeployment(deployment({ state: "BUILDING" }))).toBe(false);
    expect(isRelevantDeployment(deployment({ state: "CANCELED" }))).toBe(false);
  });

  it("makes a failed production deployment a high-priority unread item", () => {
    const item = normalizeDeployment(deployment(), "acme");
    expect(item).toMatchObject({
      id: "vercel:deployment:dpl_1",
      source: "vercel",
      kind: "deployment",
      title: "personal-dashboard: production deployment failed",
      priority: "high",
      status: "unread",
      url: "https://vercel.com/team/personal-dashboard/dpl_1",
      receivedAt: "2026-11-25T08:00:00.000Z",
      sender: { name: "marcus", handle: "marcus" },
    });
    expect(item.body).toContain("(acme)");
    expect(item.body).toContain("main @ 4d2e9c1");
  });

  it("treats a failed preview as normal priority", () => {
    expect(normalizeDeployment(deployment({ target: null })).priority).toBe("normal");
  });

  it("records a successful production deploy as low priority and already read", () => {
    const item = normalizeDeployment(deployment({ state: "READY" }));
    expect(item).toMatchObject({
      title: "personal-dashboard deployed to production",
      priority: "low",
      status: "read",
    });
  });

  it("reads the state from readyState and falls back to the deployment URL", () => {
    const item = normalizeDeployment(
      deployment({
        state: undefined,
        readyState: "ERROR",
        inspectorUrl: undefined,
        creator: undefined,
      }),
    );
    expect(item.priority).toBe("high");
    expect(item.url).toBe("https://personal-dashboard-abc.vercel.app");
    expect(item.sender.name).toBe("Vercel");
  });
});
