-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Job"
    ADD COLUMN "companyName" TEXT,
    ADD COLUMN "companyId" TEXT;

-- Backfill from legacy company column
UPDATE "Job"
SET "companyName" = "company"
WHERE "companyName" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_name_key" ON "Company"("userId", "name");
CREATE INDEX "Company_userId_name_idx" ON "Company"("userId", "name");
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
