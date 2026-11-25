import type { ActionPayload, ActionType, FeedItem, Source } from "@/features/feed/types";

export interface ConnectedAccount {
  id: string;
  source: Source;
  externalAccountId: string;
  /** Decrypted at the edge of the adapter call; never sent to the browser. */
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  /** Choices the user made in Settings for this connection; shape is owned by the adapter. */
  settings?: Record<string, unknown>;
}

export interface IntegrationAdapter {
  source: Source;
  /** Returns every item on first sync, and only newer ones when `since` is given. */
  fetchItems(account: ConnectedAccount, since?: Date): Promise<FeedItem[]>;
  performAction(
    account: ConnectedAccount,
    item: FeedItem,
    action: ActionType,
    payload?: ActionPayload,
  ): Promise<void>;
  handleWebhook?(req: Request): Promise<FeedItem[]>;
}

export type AdapterMap = Record<Source, IntegrationAdapter>;
export type AccountMap = Record<Source, ConnectedAccount>;

export interface TokenSet {
  /** Provider-side account id (Slack: `teamId:userId`). */
  externalAccountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
}

export interface OAuthProvider {
  /** Sources one grant connects. The first is the canonical one used in redirect URIs. */
  sources: Source[];
  buildAuthorizeUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<TokenSet>;
  /** Trades a refresh token for a new access token; absent for tokens that never expire. */
  refresh?(refreshToken: string): Promise<Pick<TokenSet, "accessToken" | "expiresAt">>;
}

/** For services without a usable OAuth flow: the user pastes a personal access token instead. */
export interface TokenField {
  name: string;
  label: string;
  placeholder?: string;
  /** When set the field is a dropdown instead of free text. */
  options?: { value: string; label: string }[];
}

export interface TokenProvider {
  /** Extra inputs shown next to the token (an organization slug, a region). */
  fields?: TokenField[];
  /** Where the user creates the token, and what to give it. Shown next to the input. */
  helpUrl: string;
  helpText: string;
  /** Checks the token against the vendor and returns what to store. Throws if it is rejected. */
  verify(token: string, fields?: Record<string, string>): Promise<TokenSet>;
}
