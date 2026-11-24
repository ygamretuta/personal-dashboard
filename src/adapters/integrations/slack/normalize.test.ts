import { describe, expect, it } from "vitest";
import {
  buildExternalId,
  cleanSlackText,
  normalizeSlackMessage,
  parseExternalId,
} from "./normalize";

const sender = { name: "Priya Nair", handle: "priya" };

describe("Slack normalizer", () => {
  it("normalizes a direct message as high priority", () => {
    const item = normalizeSlackMessage(
      { ts: "1700000000.000100", text: "Can you look?" },
      { channelId: "D123", sender },
    );
    expect(item).toMatchObject({
      id: "slack:D123:1700000000.000100",
      source: "slack",
      kind: "message",
      title: "Priya Nair in a direct message",
      priority: "high",
      status: "unread",
      receivedAt: "2023-11-14T22:13:20.000Z",
    });
    expect(item.url).toContain("channel=D123&message_ts=1700000000.000100");
  });

  it("normalizes a channel mention as normal priority", () => {
    const item = normalizeSlackMessage(
      { ts: "1700000000.000100", text: "hi" },
      { channelId: "C1", channelName: "eng", sender },
    );
    expect(item.title).toBe("Priya Nair mentioned you in #eng");
    expect(item.priority).toBe("normal");
  });

  it("truncates the preview but keeps the full body", () => {
    const text = "word ".repeat(100);
    const item = normalizeSlackMessage({ ts: "1.0", text }, { channelId: "D1", sender });
    expect(item.preview.length).toBeLessThanOrEqual(200);
    expect(item.body.length).toBeGreaterThan(200);
  });

  it("offers reply, mark read, snooze and open", () => {
    const item = normalizeSlackMessage({ ts: "1.0", text: "x" }, { channelId: "D1", sender });
    expect(item.actions).toEqual(["reply", "markRead", "snooze", "open"]);
  });
});

describe("Slack text cleaning", () => {
  it("resolves mentions, links and entities", () => {
    const text = "<@U1> see <https://x.dev|the docs> and <https://y.dev> &amp; <#C1|eng> &lt;3";
    expect(cleanSlackText(text, { U1: "Marcus" })).toBe(
      "@Marcus see the docs and https://y.dev & #eng <3",
    );
  });
});

describe("Slack item ids", () => {
  it("round-trips channel, ts and thread", () => {
    expect(parseExternalId(buildExternalId("C1", "2.0", "1.0"))).toEqual({
      channelId: "C1",
      ts: "2.0",
      threadTs: "1.0",
    });
  });

  it("omits the thread when the message is the thread root", () => {
    expect(buildExternalId("C1", "1.0", "1.0")).toBe("C1:1.0");
  });

  it("rejects malformed ids", () => {
    expect(() => parseExternalId("nonsense")).toThrow();
  });
});
