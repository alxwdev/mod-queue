-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('POST', 'COMMENT');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('PENDING', 'APPROVED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'OFF_TOPIC', 'SELF_PROMOTION', 'LOW_EFFORT', 'MISLEADING', 'RULE_BREAK', 'OTHER');

-- CreateEnum
CREATE TYPE "ModActionType" AS ENUM ('APPROVE', 'REMOVE', 'BAN');

-- CreateEnum
CREATE TYPE "ModeratorRole" AS ENUM ('MODERATOR', 'ADMIN');

-- CreateTable
CREATE TABLE "Moderator" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "ModeratorRole" NOT NULL DEFAULT 'MODERATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Moderator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Community" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" UUID NOT NULL,
    "type" "ContentType" NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "parentTitle" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PENDING',
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "firstReportedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "communityId" UUID NOT NULL,
    "authorId" UUID NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentId" UUID NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemovalReason" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemovalReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModAction" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "type" "ModActionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undoneAt" TIMESTAMP(3),
    "contentId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "moderatorId" UUID NOT NULL,
    "removalReasonId" UUID,
    "reasonTitle" TEXT,
    "messageToUser" TEXT,
    "banDurationDays" INTEGER,
    "banExpiresAt" TIMESTAMP(3),

    CONSTRAINT "ModAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Moderator_username_key" ON "Moderator"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Author_username_key" ON "Author"("username");

-- CreateIndex
CREATE INDEX "Content_status_firstReportedAt_id_idx" ON "Content"("status", "firstReportedAt", "id");

-- CreateIndex
CREATE INDEX "Content_status_reportCount_firstReportedAt_id_idx" ON "Content"("status", "reportCount", "firstReportedAt", "id");

-- CreateIndex
CREATE INDEX "Content_communityId_status_idx" ON "Content"("communityId", "status");

-- CreateIndex
CREATE INDEX "Content_authorId_idx" ON "Content"("authorId");

-- CreateIndex
CREATE INDEX "Report_contentId_idx" ON "Report"("contentId");

-- CreateIndex
CREATE INDEX "Report_reason_contentId_idx" ON "Report"("reason", "contentId");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "ModAction_createdAt_id_idx" ON "ModAction"("createdAt", "id");

-- CreateIndex
CREATE INDEX "ModAction_batchId_idx" ON "ModAction"("batchId");

-- CreateIndex
CREATE INDEX "ModAction_contentId_idx" ON "ModAction"("contentId");

-- CreateIndex
CREATE INDEX "ModAction_authorId_type_createdAt_idx" ON "ModAction"("authorId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ModAction_moderatorId_createdAt_idx" ON "ModAction"("moderatorId", "createdAt");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModAction" ADD CONSTRAINT "ModAction_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModAction" ADD CONSTRAINT "ModAction_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModAction" ADD CONSTRAINT "ModAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "Moderator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModAction" ADD CONSTRAINT "ModAction_removalReasonId_fkey" FOREIGN KEY ("removalReasonId") REFERENCES "RemovalReason"("id") ON DELETE SET NULL ON UPDATE CASCADE;
