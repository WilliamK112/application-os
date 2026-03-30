type PasswordResetEmailInput = {
  email: string;
  token: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";

function getBaseUrl(): string {
  const baseUrl = process.env.APP_OS_PUBLIC_URL ?? process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    throw new Error("Missing APP_OS_PUBLIC_URL or NEXTAUTH_URL for password reset URL composition.");
  }

  return baseUrl;
}

export function buildPasswordResetUrl(token: string): string {
  const baseUrl = getBaseUrl();
  const url = new URL("/reset-password", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

async function sendWithResend(input: PasswordResetEmailInput): Promise<void> {
  const apiKey = process.env.APP_OS_RESEND_API_KEY;
  const fromEmail = process.env.APP_OS_EMAIL_FROM;

  if (!apiKey) {
    throw new Error("Missing APP_OS_RESEND_API_KEY for resend provider.");
  }

  if (!fromEmail) {
    throw new Error("Missing APP_OS_EMAIL_FROM for resend provider.");
  }

  const resetUrl = buildPasswordResetUrl(input.token);

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.email],
      subject: "Reset your Application OS password",
      text: `Use this link to reset your password: ${resetUrl}`,
      html: `<p>Use this link to reset your password:</p><p><a href=\"${resetUrl}\">${resetUrl}</a></p>`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend delivery failed: ${response.status} ${details}`.trim());
  }
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
  const provider = process.env.APP_OS_EMAIL_PROVIDER ?? "console";

  if (provider === "resend") {
    await sendWithResend(input);
    return;
  }

  if (provider === "console") {
    const resetUrl = buildPasswordResetUrl(input.token);
    process.stdout.write(`password-reset-email to=${input.email} url=${resetUrl}\n`);
    return;
  }

  throw new Error(`Unsupported APP_OS_EMAIL_PROVIDER: ${provider}`);
}
