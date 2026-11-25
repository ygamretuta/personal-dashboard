import { OAUTH_PROVIDERS } from "@/adapters/integrations/registry";
import type { TokenSet, ConnectedAccount } from "@/adapters/integrations/types";
import { db } from "@/db/client";
import { Prisma } from "@/generated/prisma/client";
import { decrypt, encrypt } from "@/lib/crypto";
import { needsRefresh } from "@/lib/token-expiry";
import type { Source } from "@/features/feed/types";

/** Stores a provider token set with both tokens encrypted at rest. */
export async function saveAccount(userId: string, source: Source, tokens: TokenSet): Promise<void> {
  const data = {
    encryptedAccessToken: encrypt(tokens.accessToken),
    encryptedRefreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
    expiresAt: tokens.expiresAt ?? null,
    scopes: tokens.scopes,
  };
  await db.connectedAccount.upsert({
    where: {
      userId_source_externalAccountId: {
        userId,
        source,
        externalAccountId: tokens.externalAccountId,
      },
    },
    update: data,
    create: { userId, source, externalAccountId: tokens.externalAccountId, ...data },
  });
}

/** Returns the decrypted account, transparently refreshing an expired access token first. */
export async function getAccount(userId: string, source: Source): Promise<ConnectedAccount | null> {
  const record = await db.connectedAccount.findFirst({
    where: { userId, source },
    orderBy: { id: "desc" },
  });
  if (!record) return null;

  const account: ConnectedAccount = {
    id: record.id,
    source,
    externalAccountId: record.externalAccountId,
    accessToken: decrypt(record.encryptedAccessToken),
    refreshToken: record.encryptedRefreshToken ? decrypt(record.encryptedRefreshToken) : undefined,
    expiresAt: record.expiresAt ?? undefined,
    settings: (record.settings as Record<string, unknown> | null) ?? undefined,
  };

  const provider = OAUTH_PROVIDERS[source];
  if (!needsRefresh(record.expiresAt) || !account.refreshToken || !provider?.refresh)
    return account;

  const fresh = await provider.refresh(account.refreshToken);
  await db.connectedAccount.update({
    where: { id: record.id },
    data: { encryptedAccessToken: encrypt(fresh.accessToken), expiresAt: fresh.expiresAt ?? null },
  });
  return { ...account, ...fresh };
}

export async function listConnectedSources(userId: string): Promise<Source[]> {
  const records = await db.connectedAccount.findMany({
    where: { userId },
    select: { source: true },
  });
  return records.map((record) => record.source);
}

export async function findAccountByExternalId(source: Source, externalAccountId: string) {
  const record = await db.connectedAccount.findFirst({ where: { source, externalAccountId } });
  if (!record) return null;
  const account = await getAccount(record.userId, source);
  return account && { userId: record.userId, account };
}

export async function deleteAccounts(userId: string, source: Source): Promise<void> {
  await db.connectedAccount.deleteMany({ where: { userId, source } });
}

export async function markSynced(accountId: string): Promise<void> {
  await db.connectedAccount.update({
    where: { id: accountId },
    data: { lastSyncedAt: new Date() },
  });
}

/** Saves the user's choices for a connection (for example watched Sentry projects). */
export async function updateAccountSettings(
  userId: string,
  source: Source,
  settings: Record<string, unknown> | null,
): Promise<void> {
  await db.connectedAccount.updateMany({
    where: { userId, source },
    data: { settings: settings ? (settings as Prisma.InputJsonObject) : Prisma.DbNull },
  });
}
