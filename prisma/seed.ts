import {
  ApplicationStatus,
  DocumentType,
  FollowUpStatus,
  JobStatus,
  PrismaClient,
} from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const DEFAULT_EMAIL = process.env.APP_OS_DEFAULT_USER_EMAIL ?? "candidate@example.com";
const DEFAULT_NAME = process.env.APP_OS_DEFAULT_USER_NAME ?? "Alex Candidate";
const DEFAULT_PASSWORD = process.env.APP_OS_DEFAULT_USER_PASSWORD ?? "candidate123";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_EMAIL },
    update: {
      name: DEFAULT_NAME,
      timezone: "America/Chicago",
      passwordHash: hashPassword(DEFAULT_PASSWORD),
    },
    create: {
      email: DEFAULT_EMAIL,
      name: DEFAULT_NAME,
      passwordHash: hashPassword(DEFAULT_PASSWORD),
      timezone: "America/Chicago",
    },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      targetRole: "Senior Frontend Engineer",
      targetLocations: ["Chicago", "Remote"],
      salaryMin: 140000,
      salaryMax: 180000,
      remotePreference: "Hybrid",
      bio: "5+ years in React and product engineering.",
    },
    create: {
      userId: user.id,
      targetRole: "Senior Frontend Engineer",
      targetLocations: ["Chicago", "Remote"],
      salaryMin: 140000,
      salaryMax: 180000,
      remotePreference: "Hybrid",
      bio: "5+ years in React and product engineering.",
    },
  });

  const [resume, coverLetter] = await Promise.all([
    prisma.document.upsert({
      where: { id: `${user.id}_resume_v3` },
      update: {
        name: "Resume - Product Engineering v3",
        type: DocumentType.RESUME,
        version: "v3",
        url: "https://example.com/docs/resume-v3.pdf",
        isDefault: true,
        tags: ["react", "typescript", "leadership"],
      },
      create: {
        id: `${user.id}_resume_v3`,
        userId: user.id,
        name: "Resume - Product Engineering v3",
        type: DocumentType.RESUME,
        version: "v3",
        url: "https://example.com/docs/resume-v3.pdf",
        isDefault: true,
        tags: ["react", "typescript", "leadership"],
      },
    }),
    prisma.document.upsert({
      where: { id: `${user.id}_cover_general` },
      update: {
        name: "Cover Letter - General",
        type: DocumentType.COVER_LETTER,
        version: "2026-03",
        url: "https://example.com/docs/cover-general.pdf",
        isDefault: true,
        tags: ["general"],
      },
      create: {
        id: `${user.id}_cover_general`,
        userId: user.id,
        name: "Cover Letter - General",
        type: DocumentType.COVER_LETTER,
        version: "2026-03",
        url: "https://example.com/docs/cover-general.pdf",
        isDefault: true,
        tags: ["general"],
      },
    }),
  ]);

  const acmeJob = await prisma.job.upsert({
    where: { id: `${user.id}_job_acme` },
    update: {
      company: "Acme AI",
      title: "Frontend Engineer",
      location: "Remote",
      source: "LinkedIn",
      salaryMin: 150000,
      salaryMax: 175000,
      status: JobStatus.APPLIED,
      url: "https://example.com/jobs/acme-frontend",
      notes: "High-priority target.",
    },
    create: {
      id: `${user.id}_job_acme`,
      userId: user.id,
      company: "Acme AI",
      title: "Frontend Engineer",
      location: "Remote",
      source: "LinkedIn",
      salaryMin: 150000,
      salaryMax: 175000,
      status: JobStatus.APPLIED,
      url: "https://example.com/jobs/acme-frontend",
      notes: "High-priority target.",
    },
  });

  await prisma.job.upsert({
    where: { id: `${user.id}_job_rocket` },
    update: {
      company: "Blue Rocket",
      title: "Product Engineer",
      location: "Chicago",
      source: "Referral",
      salaryMin: 145000,
      salaryMax: 165000,
      status: JobStatus.SAVED,
      url: "https://example.com/jobs/blue-rocket-product-engineer",
    },
    create: {
      id: `${user.id}_job_rocket`,
      userId: user.id,
      company: "Blue Rocket",
      title: "Product Engineer",
      location: "Chicago",
      source: "Referral",
      salaryMin: 145000,
      salaryMax: 165000,
      status: JobStatus.SAVED,
      url: "https://example.com/jobs/blue-rocket-product-engineer",
    },
  });

  const application = await prisma.application.upsert({
    where: {
      userId_jobId: {
        userId: user.id,
        jobId: acmeJob.id,
      },
    },
    update: {
      status: ApplicationStatus.SCREENING,
      appliedAt: new Date("2026-03-18T15:00:00.000Z"),
      lastActivityAt: new Date(),
      notes: "Recruiter replied, waiting on panel scheduling.",
    },
    create: {
      userId: user.id,
      jobId: acmeJob.id,
      status: ApplicationStatus.SCREENING,
      appliedAt: new Date("2026-03-18T15:00:00.000Z"),
      lastActivityAt: new Date(),
      notes: "Recruiter replied, waiting on panel scheduling.",
    },
  });

  await prisma.applicationDocument.upsert({
    where: {
      applicationId_documentId: {
        applicationId: application.id,
        documentId: resume.id,
      },
    },
    update: {},
    create: {
      applicationId: application.id,
      documentId: resume.id,
    },
  });

  await prisma.applicationDocument.upsert({
    where: {
      applicationId_documentId: {
        applicationId: application.id,
        documentId: coverLetter.id,
      },
    },
    update: {},
    create: {
      applicationId: application.id,
      documentId: coverLetter.id,
    },
  });

  await prisma.followUp.upsert({
    where: { id: `${user.id}_followup_acme` },
    update: {
      applicationId: application.id,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: FollowUpStatus.PENDING,
      channel: "Email",
      content: "Friendly check-in about interview timeline.",
      completedAt: null,
    },
    create: {
      id: `${user.id}_followup_acme`,
      userId: user.id,
      applicationId: application.id,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: FollowUpStatus.PENDING,
      channel: "Email",
      content: "Friendly check-in about interview timeline.",
    },
  });

  console.log(`Seed complete for ${DEFAULT_EMAIL} (${user.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
