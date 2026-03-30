import type { ApplicantProfile } from "@/lib/jobs/applicant-profile";
import type { JobApplyProvider } from "@/lib/jobs/providers";

export type ProviderSubmitPlan = {
  provider: JobApplyProvider;
  requiredFields: Array<keyof ApplicantProfile>;
  missingFields: Array<keyof ApplicantProfile>;
  summary: string;
};

const PROVIDER_REQUIRED_FIELDS: Record<JobApplyProvider, Array<keyof ApplicantProfile>> = {
  greenhouse: ["fullName", "email", "phone"],
  lever: ["fullName", "email", "phone"],
  workday: ["fullName", "email", "phone", "resumeUrl"],
  unknown: ["fullName", "email", "phone"],
};

export function buildProviderSubmitPlan(
  provider: JobApplyProvider,
  profile: Partial<ApplicantProfile>,
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
