-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "AutoApplyRunStatus" AS ENUM ('success', 'failed', 'needs_manual');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AutoApplyRunLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "status" "AutoApplyRunStatus" NOT NULL,
  "message" TEXT NOT NULL,
  "applicationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutoApplyRunLog_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
DO $$
BEGIN
  ALTER TABLE "AutoApplyRunLog"
    ADD CONSTRAINT "AutoApplyRunLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "AutoApplyRunLog"
    ADD CONSTRAINT "AutoApplyRunLog_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "AutoApplyRunLog"
    ADD CONSTRAINT "AutoApplyRunLog_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "AutoApplyRunLog_userId_createdAt_idx" ON "AutoApplyRunLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AutoApplyRunLog_userId_status_createdAt_idx" ON "AutoApplyRunLog"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "AutoApplyRunLog_jobId_createdAt_idx" ON "AutoApplyRunLog"("jobId", "createdAt");
