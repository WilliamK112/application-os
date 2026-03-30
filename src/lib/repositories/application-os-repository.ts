import {
  ApplicationStatus as PrismaApplicationStatus,
  AutoApplyFailureCategory as PrismaAutoApplyFailureCategory,
  AutoApplyRunStatus as PrismaAutoApplyRunStatus,
  DocumentType as PrismaDocumentType,
  JobStatus as PrismaJobStatus,
  Prisma,
  type Application as PrismaApplication,
  type AutoApplyRunLog as PrismaAutoApplyRunLog,
  type Job as PrismaJob,
  type Profile as PrismaProfile,
  type User as PrismaUser,
} from "@prisma/client";
import type {
  Application,
  ApplicationStatus,
  ApplicationWithJob,
  AutoApplyFailureCategory,
  AutoApplyRunLog,
  AutoApplyRunStatus,
  DashboardSnapshot,
  Document,
  FollowUp,
  Job,
  JobStatus,
  Profile,
  User,
} from "@/types/domain";
import { prisma } from "@/lib/db/prisma";

export interface CreateJobInput {
  company: string;
  title: string;
  location?: string;
  source?: string;
  status?: JobStatus;
  url?: string;
  notes?: string;
}

export interface UpdateJobStatusInput {
  jobId: string;
  status: JobStatus;
}

export interface CreateApplicationInput {
  jobId: string;
  status?: ApplicationStatus;
  appliedAt?: string;
  notes?: string;
}

export interface UpdateApplicationStatusInput {
  applicationId: string;
  status: ApplicationStatus;
}

export interface CreateAutoApplyRunLogInput {
  jobId: string;
  status: AutoApplyRunStatus;
  failureCategory?: AutoApplyFailureCategory;
  message: string;
  applicationId?: string;
}

export interface ListAutoApplyRunLogsInput {
  status?: AutoApplyRunStatus;
  failureCategory?: AutoApplyFailureCategory;
  limit?: number;
}

export interface CreateFollowUpInput {
  applicationId: string;
  dueAt: string;
  channel?: string;
  content?: string;
}

export interface UpdateFollowUpStatusInput {
  followUpId: string;
  status: FollowUpStatus;
}

export interface CreateDocumentInput {
  name: string;
  type: string;
  version?: string;
  url?: string;
  tags?: string[];
  isDefault?: boolean;
}

export interface UploadDocumentResult {
  key: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface ApplicationOsRepository {
  getCurrentUser(): Promise<User>;
  getProfile(userId: string): Promise<Profile | null>;
  listJobs(userId: string): Promise<Job[]>;
  createJob(userId: string, input: CreateJobInput): Promise<Job>;
  updateJobStatus(userId: string, input: UpdateJobStatusInput): Promise<Job>;
  listApplications(userId: string): Promise<ApplicationWithJob[]>;
  createApplication(userId: string, input: CreateApplicationInput): Promise<ApplicationWithJob>;
  updateApplicationStatus(
    userId: string,
    input: UpdateApplicationStatusInput,
  ): Promise<ApplicationWithJob>;
  createAutoApplyRunLogs(userId: string, input: CreateAutoApplyRunLogInput[]): Promise<void>;
  listAutoApplyRunLogs(userId: string, input?: ListAutoApplyRunLogsInput): Promise<AutoApplyRunLog[]>;
  listDocuments(userId: string): Promise<Document[]>;
  createDocument(userId: string, input: CreateDocumentInput): Promise<Document>;
  listFollowUps(userId: string): Promise<FollowUp[]>;
  createFollowUp(userId: string, input: CreateFollowUpInput): Promise<FollowUp>;
  updateFollowUpStatus(userId: string, input: UpdateFollowUpStatusInput): Promise<FollowUp>;
  getDashboardSnapshot(userId: string): Promise<DashboardSnapshot>;
}

const now = new Date();
const isoDaysAgo = (days: number): string => {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const isoDaysAfter = (days: number): string => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const DEFAULT_EMAIL = process.env.APP_OS_DEFAULT_USER_EMAIL ?? "candidate@example.com";
const DEFAULT_NAME = process.env.APP_OS_DEFAULT_USER_NAME ?? "Alex Candidate";

const toIso = (value: Date | null | undefined): string | undefined => value?.toISOString();

const mapUser = (user: PrismaUser): User => ({
  id: user.id,
  email: user.email,
  name: user.name,
  timezone: user.timezone,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

const mapProfile = (profile: PrismaProfile): Profile => ({
  id: profile.id,
  userId: profile.userId,
  targetRole: profile.targetRole ?? undefined,
  targetLocations: profile.targetLocations,
  salaryMin: profile.salaryMin ?? undefined,
  salaryMax: profile.salaryMax ?? undefined,
  remotePreference: profile.remotePreference ?? undefined,
  bio: profile.bio ?? undefined,
  createdAt: profile.createdAt.toISOString(),
  updatedAt: profile.updatedAt.toISOString(),
});

const mapJob = (job: PrismaJob): Job => ({
  id: job.id,
  userId: job.userId,
  company: job.company,
  title: job.title,
  location: job.location ?? undefined,
  source: job.source ?? undefined,
  salaryMin: job.salaryMin ?? undefined,
  salaryMax: job.salaryMax ?? undefined,
  status: job.status,
  url: job.url ?? undefined,
  notes: job.notes ?? undefined,
  createdAt: job.createdAt.toISOString(),
  updatedAt: job.updatedAt.toISOString(),
});

const mapApplication = (application: PrismaApplication): Application => ({
  id: application.id,
  userId: application.userId,
  jobId: application.jobId,
  status: application.status,
  appliedAt: toIso(application.appliedAt),
  lastActivityAt: toIso(application.lastActivityAt),
  notes: application.notes ?? undefined,
  createdAt: application.createdAt.toISOString(),
  updatedAt: application.updatedAt.toISOString(),
});

const mapAutoApplyRunLog = (
  runLog: PrismaAutoApplyRunLog & {
    job: PrismaJob;
  },
): AutoApplyRunLog => ({
  id: runLog.id,
  userId: runLog.userId,
  jobId: runLog.jobId,
  status: runLog.status,
  failureCategory: runLog.failureCategory ?? undefined,
  message: runLog.message,
  applicationId: runLog.applicationId ?? undefined,
  createdAt: runLog.createdAt.toISOString(),
  job: {
    id: runLog.job.id,
    company: runLog.job.company,
    title: runLog.job.title,
  },
});

class MockApplicationOsRepository implements ApplicationOsRepository {
  private readonly user: User = {
    id: "user_1",
    email: "candidate@example.com",
    name: "Alex Candidate",
    timezone: "America/Chicago",
    createdAt: isoDaysAgo(30),
    updatedAt: isoDaysAgo(1),
  };

  private readonly profile: Profile = {
    id: "profile_1",
    userId: "user_1",
    targetRole: "Senior Frontend Engineer",
    targetLocations: ["Chicago", "Remote"],
    salaryMin: 140000,
    salaryMax: 180000,
    remotePreference: "Hybrid",
    bio: "5+ years in React and product engineering.",
    createdAt: isoDaysAgo(30),
    updatedAt: isoDaysAgo(2),
  };

  private readonly jobs: Job[] = [
    {
      id: "job_1",
      userId: "user_1",
      company: "Acme AI",
      title: "Frontend Engineer",
      location: "Remote",
      source: "LinkedIn",
      salaryMin: 150000,
      salaryMax: 175000,
      status: "APPLIED",
      url: "https://example.com/jobs/job_1",
      createdAt: isoDaysAgo(12),
      updatedAt: isoDaysAgo(3),
    },
    {
      id: "job_2",
      userId: "user_1",
      company: "Blue Rocket",
      title: "Product Engineer",
      location: "Chicago",
      source: "Referral",
      salaryMin: 145000,
      salaryMax: 170000,
      status: "SAVED",
      url: "https://example.com/jobs/job_2",
      createdAt: isoDaysAgo(6),
      updatedAt: isoDaysAgo(1),
    },
  ];

  private readonly applications: Application[] = [
    {
      id: "app_1",
      userId: "user_1",
      jobId: "job_1",
      status: "INTERVIEW",
      appliedAt: isoDaysAgo(11),
      lastActivityAt: isoDaysAgo(1),
      notes: "HR round complete; waiting for panel.",
      createdAt: isoDaysAgo(11),
      updatedAt: isoDaysAgo(1),
    },
  ];

  private readonly documents: Document[] = [
    {
      id: "doc_1",
      userId: "user_1",
      name: "Resume - Product Frontend",
      type: "RESUME",
      version: "v3",
      url: "https://example.com/docs/resume-v3.pdf",
      isDefault: true,
      tags: ["frontend", "react"],
      createdAt: isoDaysAgo(14),
      updatedAt: isoDaysAgo(4),
    },
  ];

  private readonly followUps: FollowUp[] = [
    {
      id: "follow_1",
      userId: "user_1",
      applicationId: "app_1",
      dueAt: isoDaysAfter(1),
      status: "PENDING",
      channel: "Email",
      content: "Send thank-you + availability for next round.",
      createdAt: isoDaysAgo(2),
      updatedAt: isoDaysAgo(1),
    },
  ];

  private readonly autoApplyRunLogs: AutoApplyRunLog[] = [];

  async getCurrentUser(): Promise<User> {
    return this.user;
  }

  async getProfile(userId: string): Promise<Profile | null> {
    return this.profile.userId === userId ? this.profile : null;
  }

  async listJobs(userId: string): Promise<Job[]> {
    return this.jobs.filter((job) => job.userId === userId);
  }

  async createJob(userId: string, input: CreateJobInput): Promise<Job> {
    const job: Job = {
      id: `job_${Date.now()}`,
      userId,
      company: input.company,
      title: input.title,
      location: input.location,
      source: input.source,
      status: input.status ?? "SAVED",
      url: input.url,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.jobs.unshift(job);
    return job;
  }

  async updateJobStatus(userId: string, input: UpdateJobStatusInput): Promise<Job> {
    const item = this.jobs.find((job) => job.id === input.jobId && job.userId === userId);
    if (!item) {
      throw new Error("Job not found");
    }

    item.status = input.status;
    item.updatedAt = new Date().toISOString();
    return item;
  }

  async listApplications(userId: string): Promise<ApplicationWithJob[]> {
    const apps = this.applications.filter((application) => application.userId === userId);
    return apps.flatMap((application) => {
      const job = this.jobs.find((item) => item.id === application.jobId);
      return job ? [{ application, job }] : [];
    });
  }

  async createApplication(userId: string, input: CreateApplicationInput): Promise<ApplicationWithJob> {
    const job = this.jobs.find((item) => item.id === input.jobId && item.userId === userId);
    if (!job) {
      throw new Error("Job not found");
    }

    const duplicate = this.applications.find(
      (item) => item.userId === userId && item.jobId === input.jobId,
    );
    if (duplicate) {
      throw new Error("Application already exists for this job");
    }

    const nowIso = new Date().toISOString();
    const application: Application = {
      id: `app_${Date.now()}`,
      userId,
      jobId: job.id,
      status: input.status ?? "DRAFT",
      appliedAt: input.appliedAt,
      lastActivityAt: nowIso,
      notes: input.notes,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.applications.unshift(application);
    return { application, job };
  }

  async updateApplicationStatus(
    userId: string,
    input: UpdateApplicationStatusInput,
  ): Promise<ApplicationWithJob> {
    const application = this.applications.find(
      (item) => item.id === input.applicationId && item.userId === userId,
    );

    if (!application) {
      throw new Error("Application not found");
    }

    const job = this.jobs.find((item) => item.id === application.jobId && item.userId === userId);
    if (!job) {
      throw new Error("Job not found");
    }

    application.status = input.status;
    application.lastActivityAt = new Date().toISOString();
    application.updatedAt = application.lastActivityAt;
    return { application, job };
  }

  async createAutoApplyRunLogs(userId: string, input: CreateAutoApplyRunLogInput[]): Promise<void> {
    const timestamp = new Date().toISOString();

    for (const item of input) {
      const job = this.jobs.find((entry) => entry.id === item.jobId && entry.userId === userId);
      if (!job) {
        continue;
      }

      this.autoApplyRunLogs.unshift({
        id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId,
        jobId: item.jobId,
        status: item.status,
        failureCategory: item.failureCategory,
        message: item.message,
        applicationId: item.applicationId,
        createdAt: timestamp,
        job: {
          id: job.id,
          company: job.company,
          title: job.title,
        },
      });
    }
  }

  async listAutoApplyRunLogs(
    userId: string,
    input?: ListAutoApplyRunLogsInput,
  ): Promise<AutoApplyRunLog[]> {
    const status = input?.status;
    const failureCategory = input?.failureCategory;
    const limit = input?.limit ?? 30;

    return this.autoApplyRunLogs
      .filter((item) => item.userId === userId)
      .filter((item) => (status ? item.status === status : true))
      .filter((item) => (failureCategory ? item.failureCategory === failureCategory : true))
      .slice(0, limit);
  }

  async listDocuments(userId: string): Promise<Document[]> {
    return this.documents.filter((document) => document.userId === userId);
  }

  async createDocument(userId: string, input: CreateDocumentInput): Promise<Document> {
    const document: Document = {
      id: `doc_${Date.now()}`,
      userId,
      name: input.name,
      type: input.type as Document["type"],
      version: input.version,
      url: input.url,
      isDefault: input.isDefault ?? false,
      tags: input.tags ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.documents.unshift(document);
    return document;
  }

  async listFollowUps(userId: string): Promise<FollowUp[]> {
    return this.followUps.filter((followUp) => followUp.userId === userId);
  }

  async createFollowUp(userId: string, input: CreateFollowUpInput): Promise<FollowUp> {
    const application = this.applications.find(
      (app) => app.id === input.applicationId && app.userId === userId,
    );
    if (!application) {
      throw new Error("Application not found");
    }

    const followUp: FollowUp = {
      id: `follow_${Date.now()}`,
      userId,
      applicationId: input.applicationId,
      dueAt: input.dueAt,
      status: "PENDING",
      channel: input.channel,
      content: input.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.followUps.push(followUp);
    return followUp;
  }

  async updateFollowUpStatus(userId: string, input: UpdateFollowUpStatusInput): Promise<FollowUp> {
    const followUp = this.followUps.find(
      (f) => f.id === input.followUpId && f.userId === userId,
    );
    if (!followUp) {
      throw new Error("Follow-up not found");
    }

    followUp.status = input.status;
    if (input.status === "DONE") {
      followUp.completedAt = new Date().toISOString();
    }
    followUp.updatedAt = new Date().toISOString();
    return followUp;
  }

  async getDashboardSnapshot(userId: string): Promise<DashboardSnapshot> {
    const [jobs, applications, followUps] = await Promise.all([
      this.listJobs(userId),
      this.listApplications(userId),
      this.listFollowUps(userId),
    ]);

    const activeStatuses = new Set(["APPLIED", "SCREENING", "INTERVIEW"]);
    const activeApplications = applications.filter(({ application }) =>
      activeStatuses.has(application.status),
    ).length;

    const pendingFollowUps = followUps.filter((followUp) => followUp.status === "PENDING");

    return {
      metrics: {
        totalJobs: jobs.length,
        totalApplications: applications.length,
        activeApplications,
        pendingFollowUps: pendingFollowUps.length,
      },
      upcomingFollowUps: pendingFollowUps.sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    };
  }
}

class PrismaApplicationOsRepository implements ApplicationOsRepository {
  private async getOrCreateDefaultUser(): Promise<PrismaUser> {
    return prisma.user.upsert({
      where: { email: DEFAULT_EMAIL },
      update: {},
      create: {
        email: DEFAULT_EMAIL,
        name: DEFAULT_NAME,
      },
    });
  }

  async getCurrentUser(): Promise<User> {
    const user = await this.getOrCreateDefaultUser();
    return mapUser(user);
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    return profile ? mapProfile(profile) : null;
  }

  async listJobs(userId: string): Promise<Job[]> {
    const jobs = await prisma.job.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
    return jobs.map(mapJob);
  }

  async createJob(userId: string, input: CreateJobInput): Promise<Job> {
    const job = await prisma.job.create({
      data: {
        userId,
        company: input.company,
        title: input.title,
        location: input.location,
        source: input.source,
        status: (input.status ?? "SAVED") as PrismaJobStatus,
        url: input.url,
        notes: input.notes,
      },
    });

    return mapJob(job);
  }

  async updateJobStatus(userId: string, input: UpdateJobStatusInput): Promise<Job> {
    const job = await prisma.job.updateMany({
      where: { id: input.jobId, userId },
      data: { status: input.status as PrismaJobStatus },
    });

    if (job.count === 0) {
      throw new Error("Job not found");
    }

    const updated = await prisma.job.findUnique({ where: { id: input.jobId } });
    if (!updated) {
      throw new Error("Job not found after update");
    }

    return mapJob(updated);
  }

  async listApplications(userId: string): Promise<ApplicationWithJob[]> {
    const applications = await prisma.application.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { updatedAt: "desc" },
    });

    return applications.map((item) => ({
      application: mapApplication(item),
      job: mapJob(item.job),
    }));
  }

  async createApplication(userId: string, input: CreateApplicationInput): Promise<ApplicationWithJob> {
    const existing = await prisma.application.findFirst({
      where: { userId, jobId: input.jobId },
      include: { job: true },
    });

    if (existing) {
      throw new Error("Application already exists for this job");
    }

    try {
      const created = await prisma.application.create({
        data: {
          userId,
          jobId: input.jobId,
          status: (input.status ?? "DRAFT") as PrismaApplicationStatus,
          appliedAt: input.appliedAt ? new Date(input.appliedAt) : null,
          lastActivityAt: new Date(),
          notes: input.notes,
        },
        include: { job: true },
      });

      return {
        application: mapApplication(created),
        job: mapJob(created.job),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("Application already exists for this job");
      }

      throw error;
    }
  }

  async updateApplicationStatus(
    userId: string,
    input: UpdateApplicationStatusInput,
  ): Promise<ApplicationWithJob> {
    const update = await prisma.application.updateMany({
      where: { id: input.applicationId, userId },
      data: {
        status: input.status as PrismaApplicationStatus,
        lastActivityAt: new Date(),
      },
    });

    if (update.count === 0) {
      throw new Error("Application not found");
    }

    const updated = await prisma.application.findUnique({
      where: { id: input.applicationId },
      include: { job: true },
    });

    if (!updated) {
      throw new Error("Application not found after update");
    }

    return {
      application: mapApplication(updated),
      job: mapJob(updated.job),
    };
  }

  async createAutoApplyRunLogs(userId: string, input: CreateAutoApplyRunLogInput[]): Promise<void> {
    if (input.length === 0) {
      return;
    }

    await prisma.autoApplyRunLog.createMany({
      data: input.map((item) => ({
        userId,
        jobId: item.jobId,
        status: item.status as PrismaAutoApplyRunStatus,
        failureCategory: item.failureCategory as PrismaAutoApplyFailureCategory | undefined,
        message: item.message,
        applicationId: item.applicationId,
      })),
    });
  }

  async listAutoApplyRunLogs(
    userId: string,
    input?: ListAutoApplyRunLogsInput,
  ): Promise<AutoApplyRunLog[]> {
    const logs = await prisma.autoApplyRunLog.findMany({
      where: {
        userId,
        status: input?.status ? (input.status as PrismaAutoApplyRunStatus) : undefined,
        failureCategory: input?.failureCategory
          ? (input.failureCategory as PrismaAutoApplyFailureCategory)
          : undefined,
      },
      include: {
        job: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: input?.limit ?? 30,
    });

    return logs.map(mapAutoApplyRunLog);
  }

  async listDocuments(userId: string): Promise<Document[]> {
    const documents = await prisma.document.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
    return documents.map((document) => ({
      id: document.id,
      userId: document.userId,
      name: document.name,
      type: document.type,
      version: document.version ?? undefined,
      url: document.url ?? undefined,
      isDefault: document.isDefault,
      tags: document.tags,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    }));
  }

  async createDocument(userId: string, input: CreateDocumentInput): Promise<Document> {
    const created = await prisma.document.create({
      data: {
        userId,
        name: input.name,
        type: input.type as PrismaDocumentType,
        version: input.version,
        url: input.url,
        tags: input.tags ?? [],
        isDefault: input.isDefault ?? false,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      name: created.name,
      type: created.type,
      version: created.version ?? undefined,
      url: created.url ?? undefined,
      isDefault: created.isDefault,
      tags: created.tags,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async listFollowUps(userId: string): Promise<FollowUp[]> {
    const followUps = await prisma.followUp.findMany({
      where: { userId },
      orderBy: { dueAt: "asc" },
    });

    return followUps.map((followUp) => ({
      id: followUp.id,
      userId: followUp.userId,
      applicationId: followUp.applicationId,
      dueAt: followUp.dueAt.toISOString(),
      status: followUp.status,
      channel: followUp.channel ?? undefined,
      content: followUp.content ?? undefined,
      completedAt: toIso(followUp.completedAt),
      createdAt: followUp.createdAt.toISOString(),
      updatedAt: followUp.updatedAt.toISOString(),
    }));
  }

  async createFollowUp(userId: string, input: CreateFollowUpInput): Promise<FollowUp> {
    const application = await prisma.application.findFirst({
      where: { id: input.applicationId, userId },
    });
    if (!application) {
      throw new Error("Application not found");
    }

    const created = await prisma.followUp.create({
      data: {
        userId,
        applicationId: input.applicationId,
        dueAt: new Date(input.dueAt),
        channel: input.channel,
        content: input.content,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      applicationId: created.applicationId,
      dueAt: created.dueAt.toISOString(),
      status: created.status,
      channel: created.channel ?? undefined,
      content: created.content ?? undefined,
      completedAt: toIso(created.completedAt),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateFollowUpStatus(userId: string, input: UpdateFollowUpStatusInput): Promise<FollowUp> {
    const followUp = await prisma.followUp.updateMany({
      where: { id: input.followUpId, userId },
      data: {
        status: input.status as Prisma.FollowUpStatus,
        completedAt: input.status === "DONE" ? new Date() : null,
      },
    });

    if (followUp.count === 0) {
      throw new Error("Follow-up not found");
    }

    const updated = await prisma.followUp.findUnique({ where: { id: input.followUpId } });
    if (!updated) {
      throw new Error("Follow-up not found after update");
    }

    return {
      id: updated.id,
      userId: updated.userId,
      applicationId: updated.applicationId,
      dueAt: updated.dueAt.toISOString(),
      status: updated.status,
      channel: updated.channel ?? undefined,
      content: updated.content ?? undefined,
      completedAt: toIso(updated.completedAt),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getDashboardSnapshot(userId: string): Promise<DashboardSnapshot> {
    const [totalJobs, totalApplications, activeApplications, pendingFollowUps, upcomingFollowUps] =
      await Promise.all([
        prisma.job.count({ where: { userId } }),
        prisma.application.count({ where: { userId } }),
        prisma.application.count({
          where: {
            userId,
            status: { in: ["APPLIED", "SCREENING", "INTERVIEW"] },
          },
        }),
        prisma.followUp.count({
          where: { userId, status: "PENDING" },
        }),
        prisma.followUp.findMany({
          where: { userId, status: "PENDING" },
          orderBy: { dueAt: "asc" },
          take: 5,
        }),
      ]);

    return {
      metrics: {
        totalJobs,
        totalApplications,
        activeApplications,
        pendingFollowUps,
      },
      upcomingFollowUps: upcomingFollowUps.map((followUp) => ({
        id: followUp.id,
        userId: followUp.userId,
        applicationId: followUp.applicationId,
        dueAt: followUp.dueAt.toISOString(),
        status: followUp.status,
        channel: followUp.channel ?? undefined,
        content: followUp.content ?? undefined,
        completedAt: toIso(followUp.completedAt),
        createdAt: followUp.createdAt.toISOString(),
        updatedAt: followUp.updatedAt.toISOString(),
      })),
    };
  }
}

const configuredProvider = process.env.APP_OS_REPOSITORY_PROVIDER?.toLowerCase();
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);

const provider = configuredProvider ?? (hasDatabaseUrl ? "prisma" : "mock");

export const applicationOsRepository: ApplicationOsRepository =
  provider === "prisma" ? new PrismaApplicationOsRepository() : new MockApplicationOsRepository();
