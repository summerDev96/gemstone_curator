-- AlterTable
ALTER TABLE "RelationshipAnalysis" ADD COLUMN     "inviteExpiresAt" TIMESTAMP(3),
ADD COLUMN     "inviteTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipAnalysis_inviteTokenHash_key" ON "RelationshipAnalysis"("inviteTokenHash");
