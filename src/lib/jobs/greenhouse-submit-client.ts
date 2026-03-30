import type { ExternalSubmitResult } from "@/lib/jobs/external-submit";
import {
  buildProbeFormDetectedNeedsManualResult,
  buildProbeHttpFailureResult,
  buildProbeNetworkFailureResult,
  buildProbeNoFormSignalResult,
  hasApplicationFormSignal,
  type ProbeMessageOverrides,
} from "@/lib/jobs/provider-submit-probe-utils";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const GREENHOUSE_PROBE_MESSAGE_OVERRIDES: ProbeMessageOverrides = {
  httpFailurePrefix: "greenhouse request failed during live probe.",
  needsManualText:
    "greenhouse page reachable and apply form markers detected. Auto-submit remains in assisted mode until profile/files are fully mapped.",
  networkFailurePrefix: "greenhouse live probe network failure.",
};

export async function probeGreenhouseApplicationPage(
  url: string,
  fetchFn: FetchLike,
  submitPlanMessage: string,
): Promise<ExternalSubmitResult> {
  try {
    const response = await fetchFn(url, {
      method: "GET",
      headers: {
        "user-agent": "application-os-auto-apply/0.1",
      },
    });

    if (!response.ok) {
      return buildProbeHttpFailureResult(
        "greenhouse",
        response.status,
        submitPlanMessage,
        GREENHOUSE_PROBE_MESSAGE_OVERRIDES,
      );
    }

    const html = await response.text();

    if (!hasApplicationFormSignal(html)) {
      return buildProbeNoFormSignalResult(
        "greenhouse",
        submitPlanMessage,
        GREENHOUSE_PROBE_MESSAGE_OVERRIDES,
      );
    }

    return buildProbeFormDetectedNeedsManualResult(
      "greenhouse",
      submitPlanMessage,
      GREENHOUSE_PROBE_MESSAGE_OVERRIDES,
    );
  } catch (error) {
    return buildProbeNetworkFailureResult(
      "greenhouse",
      error,
      submitPlanMessage,
      GREENHOUSE_PROBE_MESSAGE_OVERRIDES,
    );
  }
}
