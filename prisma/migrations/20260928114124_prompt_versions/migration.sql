-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "extractedWith" TEXT,
ADD COLUMN     "matchedWith" TEXT;

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "writtenWith" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "writtenWith" TEXT;
