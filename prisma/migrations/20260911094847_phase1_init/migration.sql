-- CreateEnum
CREATE TYPE "FiveElement" AS ENUM ('WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER');

-- CreateEnum
CREATE TYPE "TagCategory" AS ENUM ('WISH', 'EMOTION', 'RELATIONSHIP_GOAL');

-- CreateTable
CREATE TABLE "AnonymousSession" (
    "id" UUID NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnonymousSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stone" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nameKo" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "imageUrl" TEXT,
    "element" "FiveElement",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "TagCategory" NOT NULL,
    "labelKo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoneTag" (
    "id" UUID NOT NULL,
    "stoneId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StoneTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishSession" (
    "id" UUID NOT NULL,
    "anonymousSessionId" UUID NOT NULL,
    "primaryWishTagId" UUID NOT NULL,
    "secondaryWishTagId" UUID,
    "heartTagId" UUID NOT NULL,
    "freeTextProvided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" UUID NOT NULL,
    "wishSessionId" UUID NOT NULL,
    "stoneId" UUID NOT NULL,
    "rulesetVersion" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "heartSummary" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "comfortLines" JSONB NOT NULL,
    "microAction" TEXT NOT NULL,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "promptVersion" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" UUID NOT NULL,
    "recommendationId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousSession_sessionTokenHash_key" ON "AnonymousSession"("sessionTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Stone_slug_key" ON "Stone"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_category_idx" ON "Tag"("category");

-- CreateIndex
CREATE INDEX "StoneTag_tagId_idx" ON "StoneTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "StoneTag_stoneId_tagId_key" ON "StoneTag"("stoneId", "tagId");

-- CreateIndex
CREATE INDEX "WishSession_anonymousSessionId_idx" ON "WishSession"("anonymousSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_wishSessionId_key" ON "Recommendation"("wishSessionId");

-- CreateIndex
CREATE INDEX "Recommendation_stoneId_idx" ON "Recommendation"("stoneId");

-- CreateIndex
CREATE INDEX "Recommendation_createdAt_idx" ON "Recommendation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_recommendationId_key" ON "Feedback"("recommendationId");

-- AddForeignKey
ALTER TABLE "StoneTag" ADD CONSTRAINT "StoneTag_stoneId_fkey" FOREIGN KEY ("stoneId") REFERENCES "Stone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoneTag" ADD CONSTRAINT "StoneTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishSession" ADD CONSTRAINT "WishSession_anonymousSessionId_fkey" FOREIGN KEY ("anonymousSessionId") REFERENCES "AnonymousSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishSession" ADD CONSTRAINT "WishSession_primaryWishTagId_fkey" FOREIGN KEY ("primaryWishTagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishSession" ADD CONSTRAINT "WishSession_secondaryWishTagId_fkey" FOREIGN KEY ("secondaryWishTagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishSession" ADD CONSTRAINT "WishSession_heartTagId_fkey" FOREIGN KEY ("heartTagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_wishSessionId_fkey" FOREIGN KEY ("wishSessionId") REFERENCES "WishSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_stoneId_fkey" FOREIGN KEY ("stoneId") REFERENCES "Stone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
