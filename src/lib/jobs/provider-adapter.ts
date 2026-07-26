import type { UnifiedApplicantProfile } from "@/types/applicant-profile";
import type { Job, AutoApplyFailureCategory } from "@/types/domain";
import type { JobApplyProvider } from "@/lib/jobs/providers";
import type { SupportedProvider } from "@/lib/jobs/provider-submit-config";

export type ProviderAdapterContext = {
  provider: JobApplyProvider;
  job: Pick<Job, "id" | "company" | "title" | "url" | "location" | "source">;
  applicant: UnifiedApplicantProfile;
  dryRun: boolean;
  fetchFn?: (input: string, init?: RequestInit) => Promise<Response>;
};

export type ProviderAdapterReadiness = {
  ready: boolean;
  missingFields: string[];
  diagnostics: string[];
};

export type ProviderAdapterResult = {
  status: "success" | "failed" | "needs_manual";
  failureCategory?: AutoApplyFailureCategory;
  message: string;
};

export type ProviderAdapter = {
  provider: SupportedProvider;
  getReadiness(context: ProviderAdapterContext): ProviderAdapterReadiness;
  submit(context: ProviderAdapterContext): Promise<ProviderAdapterResult>;
};

export function getCoreApplicantFieldDiagnostics(
  applicant: UnifiedApplicantProfile,
): ProviderAdapterReadiness {
  const missingFields: string[] = [];

  if (!applicant.fullName) {
    missingFields.push("applicant.fullName");
  }

  if (!applicant.email) {
    missingFields.push("applicant.email");
  }

  if (!applicant.phone) {
    missingFields.push("applicant.phone");
  }

  return {
    ready: missingFields.length === 0,
    missingFields,
    diagnostics: applicant.diagnostics,
  };
}
