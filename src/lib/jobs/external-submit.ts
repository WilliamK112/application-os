import { loadApplicantProfileFromEnv } from "@/lib/jobs/applicant-profile";
import { composeUnifiedApplicantProfile } from "@/lib/jobs/unified-applicant-profile";
import {
  PROVIDER_FIELD_MAP,
  type SupportedProvider,
} from "@/lib/jobs/provider-submit-config";
import { getProviderAdapter } from "@/lib/jobs/provider-adapter-registry";
import { buildProviderSubmitPayload } from "@/lib/jobs/provider-submit-plan";
import type { JobApplyProvider } from "@/lib/jobs/providers";
import type { AutoApplyFailureCategory } from "@/types/domain";

export type { SupportedProvider } from "@/lib/jobs/provider-submit-config";
export {
  buildProviderSubmitPayload,
  getProviderSubmitChecklist,
} from "@/lib/jobs/provider-submit-plan";

export type ExternalSubmitStatus = "success" | "failed" | "needs_manual";

export type ExternalSubmitResult = {
  status: ExternalSubmitStatus;
  failureCategory?: AutoApplyFailureCategory;
  message: string;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type ExternalSubmitRequest = {
  provider: JobApplyProvider;
  jobUrl?: string;
  dryRun: boolean;
  fetchFn?: FetchLike;
  payloadOverrides?: Partial<Record<string, string>>;
};

function getUnifiedApplicantProfile() {
  return composeUnifiedApplicantProfile({ documents: [] });
}

function getUnifiedApplicantProfileDiagnostics(): string[] {
  return getUnifiedApplicantProfile().diagnostics.filter((item) => item.startsWith("Missing applicant "));
}

function hasUnifiedApplicantCoreFields(): boolean {
  const unifiedProfile = getUnifiedApplicantProfile();

  return Boolean(
    unifiedProfile.fullName &&
      unifiedProfile.email &&
      unifiedProfile.phone,
  );
}

function buildSubmitPlanMessage(
  provider: SupportedProvider,
  payloadOverrides?: Partial<Record<string, string>>,
): string {
  const fieldMap = PROVIDER_FIELD_MAP[provider];
  const required = fieldMap.filter((field) => field.required);
  const optional = fieldMap.filter((field) => !field.required);

  const requiredMappings = required
    .map((field) => `${field.providerField}<-${field.envVar}`)
    .join(", ");

  const optionalMappings = optional
    .map((field) => `${field.providerField}<-${field.envVar}`)
    .join(", ");

  const profile = loadApplicantProfileFromEnv();
  const unifiedDiagnostics = getUnifiedApplicantProfileDiagnostics();
  const payloadPlan = buildProviderSubmitPayload(provider, payloadOverrides);
  const payloadKeys = Object.keys(payloadPlan.payload);

  const payloadSummary =
    payloadKeys.length > 0
      ? `Payload keys ready [${payloadKeys.join(", ")}].`
      : "Payload keys ready [none].";

  const unsupportedSummary = `Unsupported provider fields pending automation [${payloadPlan.unsupportedProviderFields.join(", ")}].`;

  if (!profile.ok) {
    return (
      `Submit plan (${provider}): required mappings [${requiredMappings}] are blocked; ` +
      `missing env vars: ${profile.missing.join(", ")}. ` +
      (unifiedDiagnostics.length > 0
        ? `Unified applicant diagnostics: ${unifiedDiagnostics.join(" | ")}. `
        : "") +
      `Optional mappings: [${optionalMappings}]. ` +
      `${payloadSummary} ` +
      `Missing required payload env vars [${payloadPlan.missingRequiredEnvVars.join(", ")}]. ` +
      `Missing optional payload env vars [${payloadPlan.missingOptionalEnvVars.join(", ")}]. ` +
      unsupportedSummary
    );
  }

  return (
    `Submit plan (${provider}): required mappings ready [${requiredMappings}]. ` +
    (payloadPlan.missingOptionalEnvVars.length === 0
      ? `Optional mappings ready [${optionalMappings}]. `
      : `Optional mapping missing [${optionalMappings}] (recommended for fully automated submission). `) +
    `${payloadSummary} ` +
    (payloadPlan.missingOptionalEnvVars.length > 0
      ? `Missing optional payload env vars [${payloadPlan.missingOptionalEnvVars.join(", ")}]. `
      : "") +
    unsupportedSummary
  );
}

export async function submitExternalApplication(
  request: ExternalSubmitRequest,
): Promise<ExternalSubmitResult> {
  const { provider, dryRun, jobUrl } = request;

  const adapter = getProviderAdapter(provider);

  if (!adapter) {
    return {
      status: "needs_manual",
      message: `External auto-submit is unregistered for provider: ${provider}. Manual handling required.`,
    };
  }

  if (!jobUrl) {
    return {
      status: "failed",
      message: `${provider} external submit requires a job URL.`,
    };
  }

  const submitPlanMessage = buildSubmitPlanMessage(adapter.provider, request.payloadOverrides);

  if (dryRun) {
    return {
      status: "needs_manual",
      message:
        `Dry-run enabled: ${adapter.provider} adapter detected. Switch APP_OS_AUTO_APPLY_DRY_RUN=false to probe live page readiness. ` +
        submitPlanMessage,
    };
  }

  const profile = loadApplicantProfileFromEnv();
  const unifiedDiagnostics = getUnifiedApplicantProfileDiagnostics();

  if (!profile.ok || !hasUnifiedApplicantCoreFields()) {
    return {
      status: "needs_manual",
      message:
        `${provider} live submit blocked: missing applicant profile fields: ` +
        (profile.ok ? "env profile incomplete for live submit parity" : profile.missing.join(", ")) +
        (unifiedDiagnostics.length > 0
          ? `. Unified applicant diagnostics: ${unifiedDiagnostics.join(" | ")}`
          : "") +
        `. ${submitPlanMessage}`,
    };
  }

  return adapter.submit({
    provider,
    job: {
      id: "external-submit-job",
      company: "External Company",
      title: "External Application",
      url: jobUrl,
      location: undefined,
      source: undefined,
    },
    applicant: getUnifiedApplicantProfile(),
    dryRun,
    fetchFn: request.fetchFn ?? fetch,
  });
}
