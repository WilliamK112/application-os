import { loadApplicantProfileFromEnv } from "@/lib/jobs/applicant-profile";
import {
  PROVIDER_FIELD_MAP,
  type SupportedProvider,
} from "@/lib/jobs/provider-submit-config";
import { probeGreenhouseApplicationPage } from "@/lib/jobs/greenhouse-submit-client";
import { probeLeverApplicationPage } from "@/lib/jobs/lever-submit-client";
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

async function probeProviderPage(
  provider: SupportedProvider,
  url: string,
  fetchFn: FetchLike,
  payloadOverrides?: Partial<Record<string, string>>,
): Promise<ExternalSubmitResult> {
  const submitPlanMessage = buildSubmitPlanMessage(provider, payloadOverrides);

  if (provider === "greenhouse") {
    return probeGreenhouseApplicationPage(url, fetchFn, submitPlanMessage);
  }

  return probeLeverApplicationPage(url, fetchFn, submitPlanMessage);
}

export async function submitExternalApplication(
  request: ExternalSubmitRequest,
): Promise<ExternalSubmitResult> {
  const { provider, dryRun, jobUrl } = request;

  if (provider !== "greenhouse" && provider !== "lever") {
    return {
      status: "needs_manual",
      message: `External auto-submit is not supported for provider: ${provider}.`,
    };
  }

  if (!jobUrl) {
    return {
      status: "failed",
      message: `${provider} external submit requires a job URL.`,
    };
  }

  const submitPlanMessage = buildSubmitPlanMessage(provider, request.payloadOverrides);

  if (dryRun) {
    return {
      status: "needs_manual",
      message:
        `Dry-run enabled: ${provider} adapter detected. Switch APP_OS_AUTO_APPLY_DRY_RUN=false to probe live page readiness. ` +
        submitPlanMessage,
    };
  }

  const profile = loadApplicantProfileFromEnv();
  if (!profile.ok) {
    return {
      status: "needs_manual",
      message:
        `${provider} live submit blocked: missing applicant profile fields: ` +
        profile.missing.join(", ") +
        `. ${submitPlanMessage}`,
    };
  }

  const fetchFn = request.fetchFn ?? fetch;
  return probeProviderPage(provider, jobUrl, fetchFn, request.payloadOverrides);
}
