-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('FAMILY', 'FRIEND', 'ROMANTIC', 'COLLEAGUE', 'OTHER');

-- AlterEnum
ALTER TYPE "ConsentType" ADD VALUE 'RELATIONSHIP_PARTNER_INFO';

-- AlterTable
ALTER TABLE "ShareLink" ADD COLUMN     "relationshipAnalysisId" UUID;

-- CreateTable
CREATE TABLE "RelationshipAnalysis" (
    "id" UUID NOT NULL,
    "recommendationId" UUID NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "relationshipGoalTagId" UUID NOT NULL,
    "partnerNicknameEncrypted" BYTEA NOT NULL,
    "partnerBirthProvided" BOOLEAN NOT NULL DEFAULT false,
    "partnerFiveElementProfileId" UUID,
    "myStoneId" UUID NOT NULL,
    "partnerStoneId" UUID,
    "weStoneId" UUID NOT NULL,
    "conversationPrompt" TEXT NOT NULL,
    "microAction" TEXT NOT NULL,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "promptVersion" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RelationshipAnalysis_recommendationId_idx" ON "RelationshipAnalysis"("recommendationId");

-- AddForeignKey
ALTER TABLE "RelationshipAnalysis" ADD CONSTRAINT "RelationshipAnalysis_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipAnalysis" ADD CONSTRAINT "RelationshipAnalysis_relationshipGoalTagId_fkey" FOREIGN KEY ("relationshipGoalTagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipAnalysis" ADD CONSTRAINT "RelationshipAnalysis_partnerFiveElementProfileId_fkey" FOREIGN KEY ("partnerFiveElementProfileId") REFERENCES "FiveElementProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipAnalysis" ADD CONSTRAINT "RelationshipAnalysis_myStoneId_fkey" FOREIGN KEY ("myStoneId") REFERENCES "Stone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipAnalysis" ADD CONSTRAINT "RelationshipAnalysis_partnerStoneId_fkey" FOREIGN KEY ("partnerStoneId") REFERENCES "Stone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipAnalysis" ADD CONSTRAINT "RelationshipAnalysis_weStoneId_fkey" FOREIGN KEY ("weStoneId") REFERENCES "Stone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_relationshipAnalysisId_fkey" FOREIGN KEY ("relationshipAnalysisId") REFERENCES "RelationshipAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
