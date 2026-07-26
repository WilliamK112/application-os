import type { Profile, Document } from "@/types/domain";
import type {
  UnifiedApplicantProfile,
  UnifiedApplicantProfileBuildInput,
  UnifiedApplicantProfileSource,
} from "@/types/applicant-profile";
import { loadApplicantProfileFromEnv } from "@/lib/jobs/applicant-profile";
import { buildDocumentApplicationProfile } from "@/lib/jobs/document-application-profile";

function splitFullName(fullName?: string): { firstName?: string; lastName?: string } {
  if (!fullName) {
    return {};
  }

  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return {};
  }

  if (parts.length === 1) {
    return { firstName: parts[0] };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function mergeSources(sources: UnifiedApplicantProfileSource[]): UnifiedApplicantProfileSource {
  const unique = Array.from(new Set(sources));

  if (unique.length === 0) {
    return "merged";
  }

  if (unique.length === 1) {
    return unique[0]!;
  }

  return "merged";
}

export function buildUnifiedApplicantProfile(
  input: UnifiedApplicantProfileBuildInput = {},
): UnifiedApplicantProfile {
  const diagnostics = [...(input.diagnostics ?? [])];
  const fullName = input.fullName?.trim() || undefined;
  const derivedName = splitFullName(fullName);

  return {
    fullName,
    firstName: derivedName.firstName,
    lastName: derivedName.lastName,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    location: input.location?.trim() || undefined,
    workAuthorization: {
      ...(input.workAuthorization ?? {}),
    },
    links: {
      linkedinUrl: input.linkedinUrl?.trim() || undefined,
      githubUrl: input.githubUrl?.trim() || undefined,
      portfolioUrl: input.portfolioUrl?.trim() || undefined,
      websiteUrl: input.websiteUrl?.trim() || undefined,
    },
    documents: {
      resumeUrl: input.resumeUrl?.trim() || undefined,
      coverLetterUrl: input.coverLetterUrl?.trim() || undefined,
      portfolioUrl: input.portfolioUrl?.trim() || undefined,
    },
    preferences: {
      targetRoles: input.targetRole ? [input.targetRole] : [],
      targetLocations: input.targetLocations ?? [],
      remotePreference: input.remotePreference?.trim() || undefined,
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
    },
    answers: {
      professionalSummary: input.bio?.trim() || input.answers?.professionalSummary,
      workAuthorizationSummary: input.answers?.workAuthorizationSummary,
      sponsorshipSummary: input.answers?.sponsorshipSummary,
      salaryExpectationSummary: input.answers?.salaryExpectationSummary,
      whyCompany: input.answers?.whyCompany,
      customAnswers: input.answers?.customAnswers ?? {},
    },
    source: input.source ?? "merged",
    diagnostics,
  };
}

export function composeUnifiedApplicantProfile(input: {
  profile?: Profile | null;
  documents?: Document[];
}): UnifiedApplicantProfile {
  const envProfile = loadApplicantProfileFromEnv();
  const documentProfile = buildDocumentApplicationProfile(input.documents ?? []);

  const sources: UnifiedApplicantProfileSource[] = [];
  const diagnostics: string[] = [...documentProfile.diagnostics];

  if (input.profile) {
    sources.push("database");
  }

  if (envProfile.ok) {
    sources.push("env");
  } else {
    diagnostics.push(
      ...envProfile.missing.map((item) => `Missing env applicant field: ${item}`),
    );
  }

  if (documentProfile.resumeUrl || documentProfile.coverLetterUrl) {
    sources.push("documents");
  }

  const profile = input.profile;
  const fullName = envProfile.ok ? envProfile.profile.fullName : undefined;
  const email = envProfile.ok ? envProfile.profile.email : undefined;
  const phone = envProfile.ok ? envProfile.profile.phone : undefined;

  const unified = buildUnifiedApplicantProfile({
    fullName,
    email,
    phone,
    resumeUrl: documentProfile.resumeUrl ?? (envProfile.ok ? envProfile.profile.resumeUrl : undefined),
    coverLetterUrl: documentProfile.coverLetterUrl,
    targetRole: profile?.targetRole,
    targetLocations: profile?.targetLocations,
    remotePreference: profile?.remotePreference,
    salaryMin: profile?.salaryMin,
    salaryMax: profile?.salaryMax,
    bio: profile?.bio,
    source: mergeSources(sources),
    diagnostics,
  });

  if (!unified.fullName) {
    unified.diagnostics.push("Missing applicant full name.");
  }

  if (!unified.email) {
    unified.diagnostics.push("Missing applicant email.");
  }

  if (!unified.phone) {
    unified.diagnostics.push("Missing applicant phone.");
  }

  if (!unified.documents.resumeUrl) {
    unified.diagnostics.push("Missing applicant resume URL.");
  }

  return unified;
}
