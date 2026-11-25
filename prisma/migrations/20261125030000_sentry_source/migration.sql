-- AlterEnum
ALTER TYPE "Source" ADD VALUE 'sentry';

-- AlterEnum
ALTER TYPE "FeedItemKind" ADD VALUE 'error';

-- AlterTable
ALTER TABLE "ConnectedAccount" ADD COLUMN "settings" JSONB;
