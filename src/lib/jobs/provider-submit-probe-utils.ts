import type { ExternalSubmitResult } from "@/lib/jobs/external-submit";
import type { SupportedProvider } from "@/lib/jobs/provider-submit-config";

export type ProbeMessageOverrides = {
  httpFailurePrefix?: string;
  noFormSignalText?: string;
  needsManualText?: string;
  networkFailurePrefix?: string;
};

function withFallback(value: string | undefined, fallback: string): string {
  return value?.trim() ? value : fallback;
}

export function hasApplicationFormSignal(html: string): boolean {
  const normalized = html.toLowerCase();
  return (
    normalized.includes("apply") ||
    normalized.includes("application") ||
    normalized.includes("form")
  );
}

export function buildProbeHttpFailureResult(
  provider: SupportedProvider,
  status: number,
  submitPlanMessage: string,
  overrides: ProbeMessageOverrides = {},
): ExternalSubmitResult {
  const prefix = withFallback(
    overrides.httpFailurePrefix,
    `${provider} page request failed with HTTP ${status}.`,
  );

  return {
    status: "failed",
    failureCategory: "http_failure",
    message: `${prefix} ${submitPlanMessage}`,
  };
}

export function buildProbeNoFormSignalResult(
  provider: SupportedProvider,
  submitPlanMessage: string,
  overrides: ProbeMessageOverrides = {},
): ExternalSubmitResult {
  const prefix = withFallback(
    overrides.noFormSignalText,
    `${provider} page loaded but no application form signal was detected.`,
  );

  return {
    status: "failed",
    failureCategory: "no_form",
    message: `${prefix} ${submitPlanMessage}`,
  };
}

export function buildProbeFormDetectedNeedsManualResult(
  provider: SupportedProvider,
  submitPlanMessage: string,
  overrides: ProbeMessageOverrides = {},
): ExternalSubmitResult {
  const prefix = withFallback(
    overrides.needsManualText,
    `${provider} page reachable and application form detected. ` +
      "Live auto-submit requires mapped applicant profile fields/files; manual submission still required for now.",
  );

  return {
    status: "needs_manual",
    failureCategory: "manual_handoff",
    message: `${prefix} ${submitPlanMessage}`,
  };
}

export function buildProbeNetworkFailureResult(
  provider: SupportedProvider,
  error: unknown,
  submitPlanMessage: string,
  overrides: ProbeMessageOverrides = {},
): ExternalSubmitResult {
  const message = error instanceof Error ? error.message : "Unknown network error";
  const prefix = withFallback(
    overrides.networkFailurePrefix,
    `${provider} external submit probe failed: ${message}.`,
  );

  return {
    status: "failed",
    failureCategory: "network_failure",
    message: `${prefix} ${submitPlanMessage}`,
  };
}
