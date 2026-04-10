-- CreateEnum
CREATE TYPE "AutoApplyQueueStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'NEEDS_VERIFICATION', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('PHONE_SCREEN', 'TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'ONSITE', 'FINAL_ROUND', 'OTHER');

-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('BEHAVIORAL', 'TECHNICAL', 'SYSTEM_DESIGN', 'CODING', 'LEADERSHIP', 'CULTURE_FIT', 'COMPENSATION', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'INTERVIEW_REMINDER', 'FOLLOW_UP_REMINDER', 'APPLICATION_UPDATE', 'AUTO_APPLY_COMPLETE', 'AUTO_APPLY_FAILED');

-- Preserve old company string data before dropping legacy column
ALTER TABLE "Job"
ADD COLUMN IF NOT EXISTS "companyId" TEXT,
ADD COLUMN IF NOT EXISTS "companyName" TEXT;

UPDATE "Job"
SET "companyName" = "company"
WHERE "companyName" IS NULL AND "company" IS NOT NULL;

DROP INDEX IF EXISTS "Job_company_idx";
ALTER TABLE "Job" DROP COLUMN IF EXISTS "company";

-- CreateTable
CREATE TABLE IF NOT EXISTS "Interview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "interviewType" "InterviewType" NOT NULL,
    "interviewerName" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "location" TEXT,
    "notes" TEXT,
    "questions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rating" INTEGER,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Company" (
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

CREATE TABLE IF NOT EXISTS "AutoApplyQueueItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "AutoApplyQueueStatus" NOT NULL DEFAULT 'PENDING',
    "runLogId" TEXT,
    "applicationId" TEXT,
    "errorMessage" TEXT,
    "provider" TEXT,
    "verificationToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AutoApplyQueueItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InterviewQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "QuestionCategory" NOT NULL,
    "question" TEXT NOT NULL,
    "answerHints" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InterviewQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InterviewQuestionUsage" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "usedInInterviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterviewQuestionUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Interview_userId_scheduledAt_idx" ON "Interview"("userId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "Interview_applicationId_idx" ON "Interview"("applicationId");
CREATE INDEX IF NOT EXISTS "Company_userId_name_idx" ON "Company"("userId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "Company_userId_name_key" ON "Company"("userId", "name");
CREATE INDEX IF NOT EXISTS "AutoApplyQueueItem_userId_status_createdAt_idx" ON "AutoApplyQueueItem"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "AutoApplyQueueItem_userId_verificationToken_idx" ON "AutoApplyQueueItem"("userId", "verificationToken");
CREATE INDEX IF NOT EXISTS "InterviewQuestion_userId_category_idx" ON "InterviewQuestion"("userId", "category");
CREATE INDEX IF NOT EXISTS "InterviewQuestion_userId_idx" ON "InterviewQuestion"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE INDEX IF NOT EXISTS "InterviewQuestionUsage_questionId_idx" ON "InterviewQuestionUsage"("questionId");
CREATE UNIQUE INDEX IF NOT EXISTS "InterviewQuestionUsage_interviewId_questionId_key" ON "InterviewQuestionUsage"("interviewId", "questionId");
CREATE INDEX IF NOT EXISTS "Job_companyId_idx" ON "Job"("companyId");

DO $$ BEGIN
  ALTER TABLE "Interview" ADD CONSTRAINT "Interview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AutoApplyQueueItem" ADD CONSTRAINT "AutoApplyQueueItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AutoApplyQueueItem" ADD CONSTRAINT "AutoApplyQueueItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AutoApplyQueueItem" ADD CONSTRAINT "AutoApplyQueueItem_runLogId_fkey" FOREIGN KEY ("runLogId") REFERENCES "AutoApplyRunLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AutoApplyQueueItem" ADD CONSTRAINT "AutoApplyQueueItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "InterviewQuestion" ADD CONSTRAINT "InterviewQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "InterviewQuestionUsage" ADD CONSTRAINT "InterviewQuestionUsage_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "InterviewQuestionUsage" ADD CONSTRAINT "InterviewQuestionUsage_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "InterviewQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
