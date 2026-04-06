import assert from "node:assert/strict";
import test from "node:test";
import { buildUnifiedApplicantProfile, composeUnifiedApplicantProfile } from "@/lib/jobs/unified-applicant-profile";
import type { Document, Profile } from "@/types/domain";

function doc(overrides: Partial<Document> = {}): Document {
  return {
    id: overrides.id ?? "doc_1",
    userId: overrides.userId ?? "user_1",
    name: overrides.name ?? "Resume.pdf",
    type: overrides.type ?? "RESUME",
    version: overrides.version,
    url: overrides.url,
    isDefault: overrides.isDefault ?? false,
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? new Date("2026-04-05T12:00:00.000Z").toISOString(),
    updatedAt: overrides.updatedAt ?? new Date("2026-04-05T12:00:00.000Z").toISOString(),
  };
}

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: overrides.id ?? "profile_1",
    userId: overrides.userId ?? "user_1",
    targetRole: overrides.targetRole,
    targetLocations: overrides.targetLocations ?? [],
    salaryMin: overrides.salaryMin,
    salaryMax: overrides.salaryMax,
    remotePreference: overrides.remotePreference,
    bio: overrides.bio,
    createdAt: overrides.createdAt ?? new Date("2026-04-05T12:00:00.000Z").toISOString(),
    updatedAt: overrides.updatedAt ?? new Date("2026-04-05T12:00:00.000Z").toISOString(),
  };
}

test("buildUnifiedApplicantProfile normalizes fields and derives first/last name", () => {
  const result = buildUnifiedApplicantProfile({
    fullName: "  Alex Candidate  ",
    email: " alex@example.com ",
    phone: " +1-555-123-4567 ",
    location: " Chicago, IL ",
    resumeUrl: " https://example.com/resume.pdf ",
    linkedinUrl: " https://linkedin.com/in/alex ",
    githubUrl: " https://github.com/alex ",
    targetRole: "Software Engineer",
    targetLocations: ["Chicago", "Remote"],
    remotePreference: "remote",
    salaryMin: 120000,
    salaryMax: 160000,
    bio: "  Builder of developer tools.  ",
    diagnostics: ["preexisting diagnostic"],
  });

  assert.equal(result.fullName, "Alex Candidate");
  assert.equal(result.firstName, "Alex");
  assert.equal(result.lastName, "Candidate");
  assert.equal(result.email, "alex@example.com");
  assert.equal(result.phone, "+1-555-123-4567");
  assert.equal(result.location, "Chicago, IL");
  assert.equal(result.documents.resumeUrl, "https://example.com/resume.pdf");
  assert.equal(result.links.linkedinUrl, "https://linkedin.com/in/alex");
  assert.equal(result.links.githubUrl, "https://github.com/alex");
  assert.deepEqual(result.preferences.targetRoles, ["Software Engineer"]);
  assert.deepEqual(result.preferences.targetLocations, ["Chicago", "Remote"]);
  assert.equal(result.preferences.remotePreference, "remote");
  assert.equal(result.preferences.salaryMin, 120000);
  assert.equal(result.preferences.salaryMax, 160000);
  assert.equal(result.answers.professionalSummary, "Builder of developer tools.");
  assert.deepEqual(result.diagnostics, ["preexisting diagnostic"]);
});

test("composeUnifiedApplicantProfile merges env profile, documents, and db profile into merged source", () => {
  process.env.APP_OS_APPLICANT_FULL_NAME = "Alex Candidate";
  process.env.APP_OS_APPLICANT_EMAIL = "alex@example.com";
  process.env.APP_OS_APPLICANT_PHONE = "+1-555-000-1111";
  process.env.APP_OS_APPLICANT_RESUME_URL = "https://env.example.com/resume.pdf";

  const result = composeUnifiedApplicantProfile({
    profile: profile({
      targetRole: "ML Engineer",
      targetLocations: ["Remote", "Chicago"],
      remotePreference: "remote",
      salaryMin: 130000,
      salaryMax: 180000,
      bio: "Shipping AI products.",
    }),
    documents: [
      doc({
        id: "resume_default",
        type: "RESUME",
        url: "https://docs.example.com/resume.pdf",
        isDefault: true,
      }),
      doc({
        id: "cover_default",
        type: "COVER_LETTER",
        url: "https://docs.example.com/cover.pdf",
        isDefault: true,
      }),
    ],
  });

  assert.equal(result.source, "merged");
  assert.equal(result.fullName, "Alex Candidate");
  assert.equal(result.email, "alex@example.com");
  assert.equal(result.phone, "+1-555-000-1111");
  assert.equal(result.documents.resumeUrl, "https://docs.example.com/resume.pdf");
  assert.equal(result.documents.coverLetterUrl, "https://docs.example.com/cover.pdf");
  assert.deepEqual(result.preferences.targetRoles, ["ML Engineer"]);
  assert.deepEqual(result.preferences.targetLocations, ["Remote", "Chicago"]);
  assert.equal(result.preferences.remotePreference, "remote");
  assert.equal(result.preferences.salaryMin, 130000);
  assert.equal(result.preferences.salaryMax, 180000);
  assert.equal(result.answers.professionalSummary, "Shipping AI products.");
  assert.equal(result.diagnostics.includes("Missing applicant resume URL."), false);
});

test("composeUnifiedApplicantProfile reports missing core applicant fields and resume diagnostics", () => {
  delete process.env.APP_OS_APPLICANT_FULL_NAME;
  delete process.env.APP_OS_APPLICANT_EMAIL;
  delete process.env.APP_OS_APPLICANT_PHONE;
  delete process.env.APP_OS_APPLICANT_RESUME_URL;

  const result = composeUnifiedApplicantProfile({
    profile: profile({ targetRole: "Backend Engineer" }),
    documents: [],
  });

  assert.equal(result.source, "database");
  assert.ok(result.diagnostics.includes("Missing env applicant field: APP_OS_APPLICANT_FULL_NAME"));
  assert.ok(result.diagnostics.includes("Missing env applicant field: APP_OS_APPLICANT_EMAIL"));
  assert.ok(result.diagnostics.includes("Missing env applicant field: APP_OS_APPLICANT_PHONE"));
  assert.ok(result.diagnostics.includes("Missing applicant full name."));
  assert.ok(result.diagnostics.includes("Missing applicant email."));
  assert.ok(result.diagnostics.includes("Missing applicant phone."));
  assert.ok(result.diagnostics.includes("Missing applicant resume URL."));
});
