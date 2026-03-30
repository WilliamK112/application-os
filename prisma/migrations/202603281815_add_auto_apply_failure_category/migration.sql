DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutoApplyFailureCategory') THEN
    CREATE TYPE "AutoApplyFailureCategory" AS ENUM ('http_failure', 'network_failure', 'no_form', 'manual_handoff');
  END IF;
END $$;

ALTER TABLE "AutoApplyRunLog"
ADD COLUMN IF NOT EXISTS "failureCategory" "AutoApplyFailureCategory";