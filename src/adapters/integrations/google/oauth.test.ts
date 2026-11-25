import { beforeEach, describe, expect, it, vi } from "vitest";
import { CALENDAR_EVENTS_SCOPE, createGoogleOAuth, GMAIL_MODIFY_SCOPE } from "./oauth";

const NOW = 1_700_000_000_000;
const json = (body: unknown) => new Response(JSON.stringify(body));

beforeEach(() => {
  vi.stubEnv("GOOGLE_CLIENT_ID", "client-id");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret");
});

describe("Google OAuth", () => {
  it("asks for Gmail and Calendar in one consent, offline", () => {
    const url = new URL(createGoogleOAuth().buildAuthorizeUrl("state-1", "https://app.test/cb"));
    expect(url.searchParams.get("scope")).toContain(GMAIL_MODIFY_SCOPE);
    expect(url.searchParams.get("scope")).toContain(CALENDAR_EVENTS_SCOPE);
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("state")).toBe("state-1");
  });

  it("exchanges the code for tokens and the account id", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        json({
          access_token: "at",
          refresh_token: "rt",
          expires_in: 3600,
          scope: `${GMAIL_MODIFY_SCOPE} ${CALENDAR_EVENTS_SCOPE}`,
        }),
      )
      .mockResolvedValueOnce(json({ sub: "1234" }));
    const tokens = await createGoogleOAuth(fetchImpl, () => NOW).exchangeCode(
      "code",
      "https://app.test/cb",
    );
    expect(tokens).toMatchObject({
      externalAccountId: "1234",
      accessToken: "at",
      refreshToken: "rt",
    });
    expect(tokens.expiresAt).toEqual(new Date(NOW + 3_600_000));
  });

  it("rejects a grant where the user unticked a required permission", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        json({ access_token: "at", expires_in: 3600, scope: GMAIL_MODIFY_SCOPE }),
      );
    await expect(
      createGoogleOAuth(fetchImpl).exchangeCode("code", "https://app.test/cb"),
    ).rejects.toThrow(/permission/);
  });

  it("refreshes an expired access token", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ access_token: "new", expires_in: 3600 }));
    const result = await createGoogleOAuth(fetchImpl, () => NOW).refresh!("rt");
    expect(result).toEqual({ accessToken: "new", expiresAt: new Date(NOW + 3_600_000) });
    expect(fetchImpl.mock.calls[0][1].body.get("grant_type")).toBe("refresh_token");
  });
});
