import assert from "node:assert/strict";
import test from "node:test";
import { buildPasswordResetUrl, sendPasswordResetEmail } from "@/lib/email/password-reset-email";

type EnvSnapshot = {
  APP_OS_PUBLIC_URL: string | undefined;
  NEXTAUTH_URL: string | undefined;
  APP_OS_EMAIL_PROVIDER: string | undefined;
  APP_OS_EMAIL_FROM: string | undefined;
  APP_OS_RESEND_API_KEY: string | undefined;
};

function snapshotEnv(): EnvSnapshot {
  return {
    APP_OS_PUBLIC_URL: process.env.APP_OS_PUBLIC_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    APP_OS_EMAIL_PROVIDER: process.env.APP_OS_EMAIL_PROVIDER,
    APP_OS_EMAIL_FROM: process.env.APP_OS_EMAIL_FROM,
    APP_OS_RESEND_API_KEY: process.env.APP_OS_RESEND_API_KEY,
  };
}

function restoreEnv(snapshot: EnvSnapshot): void {
  process.env.APP_OS_PUBLIC_URL = snapshot.APP_OS_PUBLIC_URL;
  process.env.NEXTAUTH_URL = snapshot.NEXTAUTH_URL;
  process.env.APP_OS_EMAIL_PROVIDER = snapshot.APP_OS_EMAIL_PROVIDER;
  process.env.APP_OS_EMAIL_FROM = snapshot.APP_OS_EMAIL_FROM;
  process.env.APP_OS_RESEND_API_KEY = snapshot.APP_OS_RESEND_API_KEY;
}

test("buildPasswordResetUrl composes URL from NEXTAUTH_URL", () => {
  const env = snapshotEnv();

  try {
    delete process.env.APP_OS_PUBLIC_URL;
    process.env.NEXTAUTH_URL = "https://app.example.com";

    const result = buildPasswordResetUrl("token_123");

    assert.equal(result, "https://app.example.com/reset-password?token=token_123");
  } finally {
    restoreEnv(env);
  }
});

test("sendPasswordResetEmail throws when resend provider is missing credentials", async () => {
  const env = snapshotEnv();

  try {
    process.env.APP_OS_EMAIL_PROVIDER = "resend";
    process.env.NEXTAUTH_URL = "https://app.example.com";
    process.env.APP_OS_RESEND_API_KEY = "";
    process.env.APP_OS_EMAIL_FROM = "";

    await assert.rejects(
      sendPasswordResetEmail({
        email: "test@example.com",
        token: "token_123",
      }),
      /APP_OS_RESEND_API_KEY/,
    );
  } finally {
    restoreEnv(env);
  }
});

test("sendPasswordResetEmail maps resend provider HTTP failure", async () => {
  const env = snapshotEnv();
  const originalFetch = globalThis.fetch;

  try {
    process.env.APP_OS_EMAIL_PROVIDER = "resend";
    delete process.env.APP_OS_PUBLIC_URL;
    process.env.NEXTAUTH_URL = "https://app.example.com";
    process.env.APP_OS_RESEND_API_KEY = "resend_key";
    process.env.APP_OS_EMAIL_FROM = "no-reply@example.com";

    globalThis.fetch = async () =>
      new Response("provider down", {
        status: 503,
      });

    await assert.rejects(
      sendPasswordResetEmail({
        email: "test@example.com",
        token: "token_123",
      }),
      /Resend delivery failed: 503 provider down/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv(env);
  }
});
