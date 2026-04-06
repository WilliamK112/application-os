export type SupportedProvider = "greenhouse" | "lever" | "workday";

export type ProviderFieldMap = {
  providerField: string;
  envVar: string;
  required: boolean;
};

export const PROVIDER_FIELD_MAP: Record<SupportedProvider, ProviderFieldMap[]> = {
  greenhouse: [
    { providerField: "full_name", envVar: "APP_OS_APPLICANT_FULL_NAME", required: true },
    { providerField: "email", envVar: "APP_OS_APPLICANT_EMAIL", required: true },
    { providerField: "phone", envVar: "APP_OS_APPLICANT_PHONE", required: true },
    { providerField: "resume_url", envVar: "APP_OS_APPLICANT_RESUME_URL", required: false },
  ],
  lever: [
    { providerField: "name", envVar: "APP_OS_APPLICANT_FULL_NAME", required: true },
    { providerField: "email", envVar: "APP_OS_APPLICANT_EMAIL", required: true },
    { providerField: "phone", envVar: "APP_OS_APPLICANT_PHONE", required: true },
    { providerField: "resume", envVar: "APP_OS_APPLICANT_RESUME_URL", required: false },
  ],
  workday: [
    { providerField: "fullName", envVar: "APP_OS_APPLICANT_FULL_NAME", required: true },
    { providerField: "email", envVar: "APP_OS_APPLICANT_EMAIL", required: true },
    { providerField: "phone", envVar: "APP_OS_APPLICANT_PHONE", required: true },
    { providerField: "resumeUrl", envVar: "APP_OS_APPLICANT_RESUME_URL", required: true },
  ],
};

export const PROVIDER_UNSUPPORTED_FIELDS: Record<SupportedProvider, string[]> = {
  greenhouse: ["cover_letter", "attachments", "work_authorization"],
  lever: ["cover_letter", "portfolio", "work_authorization"],
  workday: ["work_authorization", "education_history", "work_history", "screening_questions"],
};
