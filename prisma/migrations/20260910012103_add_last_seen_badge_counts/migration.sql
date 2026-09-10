-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSeenBadgeCounts" JSONB NOT NULL DEFAULT '{}';
