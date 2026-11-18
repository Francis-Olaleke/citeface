-- CreateEnum
CREATE TYPE "MediaProcessingStatus" AS ENUM ('PENDING_UPLOAD', 'UPLOADING', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "processedAt" TIMESTAMPTZ(6),
ADD COLUMN     "processingErrorCode" TEXT,
ADD COLUMN     "processingStartedAt" TIMESTAMPTZ(6),
ADD COLUMN     "processingStatus" "MediaProcessingStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
ADD COLUMN     "uploadExpiresAt" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "MediaAsset_processingStatus_uploadExpiresAt_idx" ON "MediaAsset"("processingStatus", "uploadExpiresAt");
