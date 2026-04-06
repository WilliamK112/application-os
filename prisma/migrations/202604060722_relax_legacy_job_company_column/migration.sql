-- The legacy "company" column still exists from the initial schema and remains NOT NULL.
-- Current application code now writes "companyName" instead, so inserts can fail in CI
-- until the old column is relaxed or removed.
ALTER TABLE "Job"
ALTER COLUMN "company" DROP NOT NULL;
