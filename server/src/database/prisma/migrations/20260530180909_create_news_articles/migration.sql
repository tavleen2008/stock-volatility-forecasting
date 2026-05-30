-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "articleUrl" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_articleUrl_key" ON "NewsArticle"("articleUrl");

-- CreateIndex
CREATE INDEX "NewsArticle_symbol_idx" ON "NewsArticle"("symbol");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");
