export type ISODateString = string;

export type JobStatus = "SAVED" | "APPLIED" | "CLOSED" | "ARCHIVED";

export type ApplicationStatus =
  | "DRAFT"
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN";

export type DocumentType = "RESUME" | "COVER_LETTER" | "PORTFOLIO" | "OTHER";

export type FollowUpStatus = "PENDING" | "DONE" | "SKIPPED";

export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Profile {
  id: string;
  userId: string;
  targetRole?: string;
  targetLocations: string[];
  salaryMin?: number;
  salaryMax?: number;
  remotePreference?: string;
  bio?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Job {
  id: string;
  userId: string;
  company: string;
  companyId?: string;
  title: string;
  location?: string;
  source?: string;
  salaryMin?: number;
  salaryMax?: number;
  status: JobStatus;
  url?: string;
  notes?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Company {
  id: string;
  userId: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  notes?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt?: ISODateString;
  lastActivityAt?: ISODateString;
  notes?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  type: DocumentType;
  version?: string;
  url?: string;
  isDefault: boolean;
  tags: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface FollowUp {
  id: string;
  userId: string;
  applicationId: string;
  dueAt: ISODateString;
  status: FollowUpStatus;
  channel?: string;
  content?: string;
  completedAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface DashboardMetrics {
  totalJobs: number;
  totalApplications: number;
  activeApplications: number;
  pendingFollowUps: number;
  totalInterviews: number;
}

export interface DashboardSnapshot {
  metrics: DashboardMetrics;
  upcomingFollowUps: FollowUp[];
  upcomingInterviews: Interview[];
}

export type AutoApplyRunStatus = "success" | "failed" | "needs_manual";
export type AutoApplyFailureCategory =
  | "http_failure"
  | "network_failure"
  | "no_form"
  | "manual_handoff";

export type InterviewType =
  | "PHONE_SCREEN"
  | "TECHNICAL"
  | "BEHAVIORAL"
  | "SYSTEM_DESIGN"
  | "ONSITE"
  | "FINAL_ROUND"
  | "OTHER";

export interface Interview {
  id: string;
  userId: string;
  applicationId: string;
  interviewType: InterviewType;
  interviewerName?: string;
  scheduledAt?: ISODateString;
  durationMinutes?: number;
  location?: string;
  notes?: string;
  questions: string[];
  rating?: number;
  outcome?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AutoApplyRunLog {
  id: string;
  userId: string;
  jobId: string;
  status: AutoApplyRunStatus;
  failureCategory?: AutoApplyFailureCategory;
  message: string;
  applicationId?: string;
  createdAt: ISODateString;
  job: Pick<Job, "id" | "company" | "title">;
}

export interface ApplicationWithJob {
  application: Application;
  job: Job;
}

export interface ApplicationWithJobAndInterviews extends ApplicationWithJob {
  interviews: Interview[];
}
