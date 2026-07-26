import { buildProviderSubmitPayload } from "@/lib/jobs/provider-submit-plan";
import type { SupportedProvider } from "@/lib/jobs/provider-submit-config";

export function buildAdapterSubmitPlanMessage(provider: SupportedProvider): string {
  const payloadPlan = buildProviderSubmitPayload(provider);
  const payloadKeys = Object.keys(payloadPlan.payload);

  const payloadSummary =
    payloadKeys.length > 0
      ? `Payload keys ready [${payloadKeys.join(", ")}].`
      : "Payload keys ready [none].";

  return (
    `Submit plan (${provider}): ` +
    (payloadPlan.missingRequiredEnvVars.length === 0
      ? "required mappings ready. "
      : `missing required payload env vars [${payloadPlan.missingRequiredEnvVars.join(", ")}]. `) +
    (payloadPlan.missingOptionalEnvVars.length === 0
      ? "optional mappings ready. "
      : `missing optional payload env vars [${payloadPlan.missingOptionalEnvVars.join(", ")}]. `) +
    `${payloadSummary} ` +
    `Unsupported provider fields pending automation [${payloadPlan.unsupportedProviderFields.join(", ")}].`
  );
}
