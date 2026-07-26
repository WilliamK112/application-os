import type { ApplicantProfile } from "@/lib/jobs/applicant-profile";
import type { JobApplyProvider } from "@/lib/jobs/providers";
import type { UnifiedApplicantProfile } from "@/types/applicant-profile";

export type ProviderSubmitProfile = Pick<UnifiedApplicantProfile, "fullName" | "email" | "phone"> & {
  resumeUrl?: string;
};

export type ProviderSubmitPlan = {
  provider: JobApplyProvider;
  requiredFields: Array<keyof ProviderSubmitProfile>;
  missingFields: Array<keyof ProviderSubmitProfile>;
  summary: string;
};

const PROVIDER_REQUIRED_FIELDS: Record<JobApplyProvider, Array<keyof ProviderSubmitProfile>> = {
  greenhouse: ["fullName", "email", "phone"],
  lever: ["fullName", "email", "phone"],
  workday: ["fullName", "email", "phone", "resumeUrl"],
  unknown: ["fullName", "email", "phone"],
};

export function buildProviderSubmitPlan(
  provider: JobApplyProvider,
  profile: Partial<ApplicantProfile | ProviderSubmitProfile>,
): ProviderSubmitPlan {
  const requiredFields = PROVIDER_REQUIRED_FIELDS[provider] ?? PROVIDER_REQUIRED_FIELDS.unknown;
  const missingFields = requiredFields.filter((field) => !profile[field]);

  const summary =
    missingFields.length === 0
      ? `${provider} submit plan ready: all required profile fields are available.`
      : `${provider} submit plan missing fields: ${missingFields.join(", ")}.`;

  return {
    provider,
    requiredFields,
    missingFields,
    summary,
  };
}
