-- CreateTable
CREATE TABLE "PostingSearch" (
    "id" TEXT NOT NULL,
    "source" "PostingSource" NOT NULL,
    "query" JSONB NOT NULL,
    "postings" JSONB NOT NULL,
    "found" INTEGER NOT NULL DEFAULT 0,
    "next" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostingSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostingSearch_createdAt_idx" ON "PostingSearch"("createdAt");
