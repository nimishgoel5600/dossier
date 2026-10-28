-- CreateEnum
CREATE TYPE "PostingSource" AS ENUM ('JSEARCH', 'ADZUNA', 'ARBEITSAGENTUR');

-- CreateTable
CREATE TABLE "Posting" (
    "id" TEXT NOT NULL,
    "source" "PostingSource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "place" TEXT NOT NULL DEFAULT '',
    "remote" BOOLEAN,
    "salary" TEXT NOT NULL DEFAULT '',
    "postedAt" TIMESTAMP(3),
    "url" TEXT NOT NULL DEFAULT '',
    "via" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "complete" BOOLEAN NOT NULL DEFAULT false,
    "savedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Posting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Posting_applicationId_key" ON "Posting"("applicationId");

-- CreateIndex
CREATE INDEX "Posting_savedAt_idx" ON "Posting"("savedAt");

-- CreateIndex
CREATE INDEX "Posting_dismissedAt_idx" ON "Posting"("dismissedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Posting_source_externalId_key" ON "Posting"("source", "externalId");

-- AddForeignKey
ALTER TABLE "Posting" ADD CONSTRAINT "Posting_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
