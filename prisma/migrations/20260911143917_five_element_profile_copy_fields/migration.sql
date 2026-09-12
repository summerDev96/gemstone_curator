-- AlterTable
ALTER TABLE "FiveElementProfile" ADD COLUMN     "comfortLines" JSONB NOT NULL,
ADD COLUMN     "heartSummary" TEXT NOT NULL,
ADD COLUMN     "microAction" TEXT NOT NULL,
ADD COLUMN     "modelName" TEXT NOT NULL,
ADD COLUMN     "promptVersion" TEXT NOT NULL,
ADD COLUMN     "rationale" TEXT NOT NULL,
ADD COLUMN     "usedFallback" BOOLEAN NOT NULL DEFAULT false;
