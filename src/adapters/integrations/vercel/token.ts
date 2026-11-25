import type { TokenProvider } from "../types";
import { createVercelClient } from "./client";
import type { VercelUserResponse } from "./types";

const TOKENS_URL = "https://vercel.com/account/tokens";

export const vercelToken: TokenProvider = {
  helpUrl: TOKENS_URL,
  helpText: "Create a token with access to the teams you want to watch, then paste it here.",

  async verify(token) {
    const { user } = await createVercelClient(token).get<VercelUserResponse>("/v2/user");
    return { externalAccountId: user.id, accessToken: token, scopes: [] };
  },
};
