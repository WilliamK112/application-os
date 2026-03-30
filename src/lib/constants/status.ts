import type { ApplicationStatus, JobStatus } from "@/types/domain";

export const JOB_STATUS_OPTIONS: JobStatus[] = ["SAVED", "APPLIED", "CLOSED", "ARCHIVED"];

export const APPLICATION_STATUS_OPTIONS: ApplicationStatus[] = [
  "DRAFT",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];
