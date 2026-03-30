import {
  PROVIDER_FIELD_MAP,
  PROVIDER_UNSUPPORTED_FIELDS,
  type SupportedProvider,
} from "@/lib/jobs/provider-submit-config";

export type ProviderSubmitPayloadPlan = {
  payload: Record<string, string>;
  missingRequiredEnvVars: string[];
  missingOptionalEnvVars: string[];
  unsupportedProviderFields: string[];
};

export type ProviderSubmitChecklist = {
  provider: SupportedProvider;
  required: Array<{ providerField: string; envVar: string; ready: boolean }>;
  optional: Array<{ providerField: string; envVar: string; ready: boolean }>;
};

type ProviderSubmitValueOverrides = Partial<Record<string, string>>;

function readEnvValue(envVar: string, overrides?: ProviderSubmitValueOverrides): string | undefined {
  const overrideValue = overrides?.[envVar]?.trim();
  if (overrideValue) {
    return overrideValue;
  }

  const value = process.env[envVar]?.trim();
  return value || undefined;
}

export function buildProviderSubmitPayload(
  provider: SupportedProvider,
  overrides?: ProviderSubmitValueOverrides,
): ProviderSubmitPayloadPlan {
  const fields = PROVIDER_FIELD_MAP[provider];

  const payload: Record<string, string> = {};
  const missingRequiredEnvVars: string[] = [];
  const missingOptionalEnvVars: string[] = [];

  for (const field of fields) {
    const value = readEnvValue(field.envVar, overrides);

    if (value) {
      payload[field.providerField] = value;
      continue;
    }

    if (field.required) {
      missingRequiredEnvVars.push(field.envVar);
    } else {
      missingOptionalEnvVars.push(field.envVar);
    }
  }

  return {
    payload,
    missingRequiredEnvVars,
    missingOptionalEnvVars,
    unsupportedProviderFields: PROVIDER_UNSUPPORTED_FIELDS[provider],
  };
}

export function getProviderSubmitChecklist(provider: SupportedProvider): ProviderSubmitChecklist {
  const fields = PROVIDER_FIELD_MAP[provider];

  return {
    provider,
    required: fields
      .filter((field) => field.required)
      .map((field) => ({
        providerField: field.providerField,
        envVar: field.envVar,
        ready: Boolean(readEnvValue(field.envVar)),
      })),
    optional: fields
      .filter((field) => !field.required)
      .map((field) => ({
        providerField: field.providerField,
        envVar: field.envVar,
        ready: Boolean(readEnvValue(field.envVar)),
      })),
  };
}
