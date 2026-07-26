import type { ProviderAdapter, ProviderAdapterContext } from "@/lib/jobs/provider-adapter";
import { getCoreApplicantFieldDiagnostics } from "@/lib/jobs/provider-adapter";
import { buildAdapterSubmitPlanMessage } from "@/lib/jobs/provider-adapter-submit-plan-message";

export const workdayAdapter: ProviderAdapter = {
  provider: "workday",
  getReadiness(context: ProviderAdapterContext) {
    const coreReadiness = getCoreApplicantFieldDiagnostics(context.applicant);
    const missingFields = [...coreReadiness.missingFields];

    if (!context.job.url) {
      missingFields.push("job.url");
    }

    if (!context.applicant.documents.resumeUrl) {
      missingFields.push("applicant.documents.resumeUrl");
    }

    return {
      ready: missingFields.length === 0,
      missingFields,
      diagnostics: coreReadiness.diagnostics,
    };
  },
  async submit(context: ProviderAdapterContext) {
    const readiness = workdayAdapter.getReadiness(context);

    if (!readiness.ready) {
      return {
        status: "needs_manual",
        message:
          `workday adapter blocked: missing fields [${readiness.missingFields.join(", ")}]. ` +
          (readiness.diagnostics.length > 0
            ? `Diagnostics: ${readiness.diagnostics.join(" | ")}. `
            : "") +
          `Job: ${context.job.title} @ ${context.job.company}.`,
      };
    }

    return {
      status: "needs_manual",
      message:
        (context.dryRun
          ? `Dry-run enabled: workday adapter detected for ${context.job.title} @ ${context.job.company}. `
          : `Workday adapter detected for ${context.job.title} @ ${context.job.company}. `) +
        `Live Workday submit is not implemented yet. ` +
        buildAdapterSubmitPlanMessage("workday"),
    };
  },
};
