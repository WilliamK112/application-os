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

const LEVER_PROBE_MESSAGE_OVERRIDES: ProbeMessageOverrides = {
  httpFailurePrefix: "lever request failed during live probe.",
  noFormSignalText:
    "lever page reachable but no explicit application form signals were found in current markup.",
  networkFailurePrefix: "lever live probe network failure.",
};

export async function probeLeverApplicationPage(
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
        "lever",
        response.status,
        submitPlanMessage,
        LEVER_PROBE_MESSAGE_OVERRIDES,
      );
    }

    const html = await response.text();

    if (!hasApplicationFormSignal(html)) {
      return buildProbeNoFormSignalResult(
        "lever",
        submitPlanMessage,
        LEVER_PROBE_MESSAGE_OVERRIDES,
      );
    }

    return buildProbeFormDetectedNeedsManualResult(
      "lever",
      submitPlanMessage,
      LEVER_PROBE_MESSAGE_OVERRIDES,
    );
  } catch (error) {
    return buildProbeNetworkFailureResult(
      "lever",
      error,
      submitPlanMessage,
      LEVER_PROBE_MESSAGE_OVERRIDES,
    );
  }
}
