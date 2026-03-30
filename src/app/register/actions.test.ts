import assert from "node:assert/strict";
import test from "node:test";
import { registerAction } from "@/app/register/actions";
import { registrationService } from "@/lib/auth/register-service-adapter";

test("registerAction returns validation error for mismatched passwords", async () => {
  const formData = new FormData();
  formData.set("name", "Test User");
  formData.set("email", "test@example.com");
  formData.set("password", "candidate123");
  formData.set("confirmPassword", "candidate124");

  const result = await registerAction({ error: "" }, formData);
  assert.equal(result.error, "Passwords do not match.");
});

test("registerAction maps duplicate account errors", async () => {
  const originalCreateUser = registrationService.createUser;

  try {
    registrationService.createUser = async () => {
      const error = new Error("duplicate");
      Object.assign(error, { code: "P2002" });
      throw error;
    };

    const formData = new FormData();
    formData.set("name", "Test User");
    formData.set("email", "test@example.com");
    formData.set("password", "candidate123");
    formData.set("confirmPassword", "candidate123");

    const result = await registerAction({ error: "" }, formData);
    assert.equal(result.error, "An account with this email already exists.");
  } finally {
    registrationService.createUser = originalCreateUser;
  }
});

test("registerAction creates user and redirects on success", async () => {
  const originalCreateUser = registrationService.createUser;

  try {
    let captured:
      | {
          name: string;
          email: string;
          passwordHash: string;
        }
      | undefined;

    registrationService.createUser = async (input) => {
      captured = input;
    };

    const formData = new FormData();
    formData.set("name", "Test User");
    formData.set("email", "Test@Example.com");
    formData.set("password", "candidate123");
    formData.set("confirmPassword", "candidate123");

    await assert.rejects(() => registerAction({ error: "" }, formData), /NEXT_REDIRECT/);

    assert.equal(captured?.name, "Test User");
    assert.equal(captured?.email, "test@example.com");
    assert.ok(typeof captured?.passwordHash === "string" && captured.passwordHash.length > 20);
  } finally {
    registrationService.createUser = originalCreateUser;
  }
});
