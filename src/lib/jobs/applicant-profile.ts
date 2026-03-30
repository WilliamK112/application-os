export type ApplicantProfile = {
  fullName: string;
  email: string;
  phone: string;
  resumeUrl?: string;
};

export type ApplicantProfileLoadResult =
  | { ok: true; profile: ApplicantProfile }
  | { ok: false; missing: string[] };

export function loadApplicantProfileFromEnv(): ApplicantProfileLoadResult {
  const fullName = process.env.APP_OS_APPLICANT_FULL_NAME?.trim();
  const email = process.env.APP_OS_APPLICANT_EMAIL?.trim();
  const phone = process.env.APP_OS_APPLICANT_PHONE?.trim();
  const resumeUrl = process.env.APP_OS_APPLICANT_RESUME_URL?.trim();

  const missing: string[] = [];
  if (!fullName) missing.push("APP_OS_APPLICANT_FULL_NAME");
  if (!email) missing.push("APP_OS_APPLICANT_EMAIL");
  if (!phone) missing.push("APP_OS_APPLICANT_PHONE");

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return {
    ok: true,
    profile: {
      fullName: fullName!,
      email: email!,
      phone: phone!,
      resumeUrl: resumeUrl || undefined,
    },
  };
}
