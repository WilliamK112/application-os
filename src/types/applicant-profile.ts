export type ApplicantWorkAuthorization = {
  workAuthorizedInUS?: boolean;
  requireSponsorship?: boolean;
  currentVisaStatus?: string;
  futureSponsorshipNeeded?: boolean;
  notes?: string;
};

export type ApplicantLinks = {
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  websiteUrl?: string;
};

export type ApplicantDocuments = {
  resumeUrl?: string;
  coverLetterUrl?: string;
  portfolioUrl?: string;
};

export type ApplicantPreferences = {
  targetRoles: string[];
  targetLocations: string[];
  remotePreference?: string;
  salaryMin?: number;
  salaryMax?: number;
  yearsOfExperience?: number;
};

export type ApplicantAnswerBank = {
  workAuthorizationSummary?: string;
  sponsorshipSummary?: string;
  salaryExpectationSummary?: string;
  professionalSummary?: string;
  whyCompany?: string;
  customAnswers: Record<string, string>;
};

export type UnifiedApplicantProfileSource = "database" | "env" | "documents" | "merged";

export type UnifiedApplicantProfile = {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  workAuthorization: ApplicantWorkAuthorization;
  links: ApplicantLinks;
  documents: ApplicantDocuments;
  preferences: ApplicantPreferences;
  answers: ApplicantAnswerBank;
  source: UnifiedApplicantProfileSource;
  diagnostics: string[];
};

export type UnifiedApplicantProfileBuildInput = {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  resumeUrl?: string;
  coverLetterUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  targetRole?: string;
  targetLocations?: string[];
  remotePreference?: string;
  salaryMin?: number;
  salaryMax?: number;
  bio?: string;
  workAuthorization?: ApplicantWorkAuthorization;
  answers?: Partial<ApplicantAnswerBank>;
  source?: UnifiedApplicantProfileSource;
  diagnostics?: string[];
};
