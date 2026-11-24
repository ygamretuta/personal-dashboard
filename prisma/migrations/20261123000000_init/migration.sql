-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('slack', 'gmail', 'calendar', 'github');

-- CreateEnum
CREATE TYPE "FeedItemKind" AS ENUM ('message', 'email', 'event', 'review_request', 'issue');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('high', 'normal', 'low');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('unread', 'read', 'archived', 'snoozed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectedAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "Source" NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "encryptedAccessToken" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scopes" TEXT[],
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "ConnectedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedItemRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "Source" NOT NULL,
    "externalId" TEXT NOT NULL,
    "kind" "FeedItemKind" NOT NULL,
    "title" TEXT NOT NULL,
    "preview" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderAvatarUrl" TEXT,
    "senderHandle" TEXT,
    "url" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'normal',
    "status" "ItemStatus" NOT NULL DEFAULT 'unread',

    CONSTRAINT "FeedItemRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snooze" (
    "itemId" TEXT NOT NULL,
    "until" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Snooze_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "DailyBrief" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "content" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedAccount_userId_source_externalAccountId_key" ON "ConnectedAccount"("userId", "source", "externalAccountId");

-- CreateIndex
CREATE INDEX "FeedItemRecord_userId_status_receivedAt_idx" ON "FeedItemRecord"("userId", "status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeedItemRecord_userId_source_externalId_key" ON "FeedItemRecord"("userId", "source", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBrief_userId_date_key" ON "DailyBrief"("userId", "date");

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItemRecord" ADD CONSTRAINT "FeedItemRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snooze" ADD CONSTRAINT "Snooze_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "FeedItemRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyBrief" ADD CONSTRAINT "DailyBrief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

