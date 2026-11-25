import type { TokenProvider } from "../types";
import { createSentryClient, isOrgSlug, isRegion, SENTRY_REGIONS } from "./client";

export const sentryToken: TokenProvider = {
  helpUrl: "https://sentry.io/settings/account/api/auth-tokens/",
  helpText:
    "Create a token with the scopes org:read, project:read and event:read. Your organization slug is the first part of your Sentry URL.",
  fields: [
    { name: "org", label: "Organization slug", placeholder: "my-org" },
    {
      name: "region",
      label: "Region",
      options: [
        { value: "us", label: "US (sentry.io)" },
        { value: "eu", label: "EU (de.sentry.io)" },
      ],
    },
  ],

  async verify(token, fields = {}) {
    const org = (fields.org ?? "").toLowerCase();
    const region = fields.region ?? "us";
    if (!isOrgSlug(org) || !isRegion(region))
      throw new Error("Invalid Sentry organization or region");
    // Reading the organization proves the token, the slug and the region all match.
    await createSentryClient(token, region).get(`/organizations/${org}/`);
    return { externalAccountId: `${region}:${org}`, accessToken: token, scopes: [] };
  },
};

export { SENTRY_REGIONS };
