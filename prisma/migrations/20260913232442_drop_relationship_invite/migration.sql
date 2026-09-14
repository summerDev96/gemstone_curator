-- DropIndex
DROP INDEX "RelationshipAnalysis_inviteTokenHash_key";

-- AlterTable
ALTER TABLE "RelationshipAnalysis" DROP COLUMN "inviteExpiresAt",
DROP COLUMN "inviteTokenHash";
