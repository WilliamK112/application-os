import type { ProviderAdapter } from "@/lib/jobs/provider-adapter";
import type { JobApplyProvider } from "@/lib/jobs/providers";
import type { SupportedProvider } from "@/lib/jobs/provider-submit-config";
import { greenhouseAdapter } from "@/lib/jobs/greenhouse-adapter";
import { leverAdapter } from "@/lib/jobs/lever-adapter";
import { workdayAdapter } from "@/lib/jobs/workday-adapter";

type RegisteredProviderAdapter = ProviderAdapter & { provider: SupportedProvider };

const PROVIDER_ADAPTERS: Partial<Record<JobApplyProvider, RegisteredProviderAdapter>> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  workday: workdayAdapter,
};

export function getProviderAdapter(provider: JobApplyProvider): RegisteredProviderAdapter | null {
  return PROVIDER_ADAPTERS[provider] ?? null;
}

export function listRegisteredProviderAdapters(): RegisteredProviderAdapter[] {
  return Object.values(PROVIDER_ADAPTERS).filter((adapter): adapter is RegisteredProviderAdapter =>
    Boolean(adapter),
  );
}
