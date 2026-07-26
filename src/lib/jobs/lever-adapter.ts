import type { ProviderAdapter, ProviderAdapterContext } from "@/lib/jobs/provider-adapter";
import { getCoreApplicantFieldDiagnostics } from "@/lib/jobs/provider-adapter";
import { buildAdapterSubmitPlanMessage } from "@/lib/jobs/provider-adapter-submit-plan-message";
import { probeLeverApplicationPage } from "@/lib/jobs/lever-submit-client";

export const leverAdapter: ProviderAdapter = {
  provider: "lever",
  getReadiness(context: ProviderAdapterContext) {
    const coreReadiness = getCoreApplicantFieldDiagnostics(context.applicant);
    const missingFields = [...coreReadiness.missingFields];

    if (!context.job.url) {
      missingFields.push("job.url");
    }

    return {
      ready: missingFields.length === 0,
      missingFields,
      diagnostics: coreReadiness.diagnostics,
    };
  },
  async submit(context: ProviderAdapterContext) {
    const readiness = leverAdapter.getReadiness(context);

    if (!readiness.ready) {
      return {
        status: "needs_manual",
        message:
          `lever adapter blocked: missing fields [${readiness.missingFields.join(", ")}]. ` +
          (readiness.diagnostics.length > 0
            ? `Diagnostics: ${readiness.diagnostics.join(" | ")}. `
            : "") +
          `Job: ${context.job.title} @ ${context.job.company}.`,
      };
    }

    if (context.dryRun) {
      return {
        status: "needs_manual",
        message:
          `Dry-run enabled: lever adapter detected for ${context.job.title} @ ${context.job.company}. ` +
          buildAdapterSubmitPlanMessage("lever"),
      };
    }

    return probeLeverApplicationPage(
      context.job.url!,
      context.fetchFn ?? fetch,
      buildAdapterSubmitPlanMessage("lever"),
    );
  },
};
