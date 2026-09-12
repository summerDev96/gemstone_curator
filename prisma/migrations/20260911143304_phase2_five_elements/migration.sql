-- CreateEnum
CREATE TYPE "CalendarType" AS ENUM ('SOLAR', 'LUNAR');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('FIVE_ELEMENTS_BIRTH_INFO');

-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN     "fiveElementProfileId" UUID;

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" UUID NOT NULL,
    "anonymousSessionId" UUID NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiveElementProfile" (
    "id" UUID NOT NULL,
    "birthDateEncrypted" BYTEA NOT NULL,
    "calendarType" "CalendarType" NOT NULL,
    "isLeapMonth" BOOLEAN NOT NULL DEFAULT false,
    "birthTimeUnknown" BOOLEAN NOT NULL DEFAULT false,
    "birthTimeEncrypted" BYTEA,
    "computedElement" "FiveElement" NOT NULL,
    "balanceJson" JSONB NOT NULL,
    "integratedStoneId" UUID,
    "consentRecordId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiveElementProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" UUID NOT NULL,
    "recommendationId" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentRecord_anonymousSessionId_idx" ON "ConsentRecord"("anonymousSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_tokenHash_key" ON "ShareLink"("tokenHash");

-- CreateIndex
CREATE INDEX "ShareLink_expiresAt_idx" ON "ShareLink"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_fiveElementProfileId_key" ON "Recommendation"("fiveElementProfileId");

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_fiveElementProfileId_fkey" FOREIGN KEY ("fiveElementProfileId") REFERENCES "FiveElementProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_anonymousSessionId_fkey" FOREIGN KEY ("anonymousSessionId") REFERENCES "AnonymousSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiveElementProfile" ADD CONSTRAINT "FiveElementProfile_integratedStoneId_fkey" FOREIGN KEY ("integratedStoneId") REFERENCES "Stone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiveElementProfile" ADD CONSTRAINT "FiveElementProfile_consentRecordId_fkey" FOREIGN KEY ("consentRecordId") REFERENCES "ConsentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

