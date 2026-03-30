import assert from "node:assert/strict";
import test from "node:test";
import {
  forgotPasswordAudit,
  forgotPasswordService,
  requestPasswordResetAction,
} from "@/app/forgot-password/actions";

test("requestPasswordResetAction validates email", async () => {
  const formData = new FormData();
  formData.set("email", "not-an-email");

  const result = await requestPasswordResetAction({ error: "", success: "" }, formData);

  assert.equal(result.error, "Please enter a valid email.");
  assert.equal(result.success, "");
});

test("requestPasswordResetAction returns lockout error when rate limited", async () => {
  const originalCheckRateLimit = forgotPasswordService.checkRateLimit;

  try {
    forgotPasswordService.checkRateLimit = async () => false;

    const formData = new FormData();
    formData.set("email", "test@example.com");

    const result = await requestPasswordResetAction({ error: "", success: "" }, formData);

    assert.equal(
      result.error,
      "Too many password reset attempts. Please wait a few minutes and try again.",
    );
    assert.equal(result.success, "");
  } finally {
    forgotPasswordService.checkRateLimit = originalCheckRateLimit;
  }
});

test("requestPasswordResetAction returns generic success when user does not exist", async () => {
  const originalCheckRateLimit = forgotPasswordService.checkRateLimit;
  const originalFindUserByEmail = forgotPasswordService.findUserByEmail;

  try {
    forgotPasswordService.checkRateLimit = async () => true;
    forgotPasswordService.findUserByEmail = async () => null;

    const formData = new FormData();
    formData.set("email", "missing@example.com");

    const result = await requestPasswordResetAction({ error: "", success: "" }, formData);

    assert.equal(result.error, "");
    assert.equal(
      result.success,
      "If an account exists for this email, we've sent password reset instructions.",
    );
  } finally {
    forgotPasswordService.checkRateLimit = originalCheckRateLimit;
    forgotPasswordService.findUserByEmail = originalFindUserByEmail;
  }
});

test("requestPasswordResetAction creates hashed token and sends instruction for existing user", async () => {
  const originalCheckRateLimit = forgotPasswordService.checkRateLimit;
  const originalFindUserByEmail = forgotPasswordService.findUserByEmail;
  const originalCreatePasswordResetToken = forgotPasswordService.createPasswordResetToken;
  const originalSendResetInstructions = forgotPasswordService.sendResetInstructions;
  const originalAuditRecord = forgotPasswordAudit.record;

  try {
    let auditEvent:
      | {
          event: string;
          actorUserId?: string;
          email?: string;
          metadata?: Record<string, unknown>;
        }
      | undefined;
    let capturedCreateInput:
      | {
          userId: string;
          tokenHash: string;
          expiresAt: Date;
        }
      | undefined;
    let capturedSendInput:
      | {
          email: string;
          token: string;
        }
      | undefined;

    forgotPasswordService.checkRateLimit = async () => true;
    forgotPasswordService.findUserByEmail = async () => ({
      id: "user_123",
      email: "test@example.com",
    });
    forgotPasswordService.createPasswordResetToken = async (input) => {
      capturedCreateInput = input;
      return { id: "prt_123" };
    };
    forgotPasswordService.sendResetInstructions = async (input) => {
      capturedSendInput = input;
    };
    forgotPasswordAudit.record = async (event) => {
      auditEvent = event as {
        event: string;
        actorUserId?: string;
        email?: string;
        metadata?: Record<string, unknown>;
      };
    };

    const formData = new FormData();
    formData.set("email", "Test@Example.com");

    const result = await requestPasswordResetAction({ error: "", success: "" }, formData);

    assert.equal(result.error, "");
    assert.equal(
      result.success,
      "If an account exists for this email, we've sent password reset instructions.",
    );
    assert.equal(capturedCreateInput?.userId, "user_123");
    assert.ok(typeof capturedCreateInput?.tokenHash === "string");
    assert.equal(capturedCreateInput?.tokenHash.length, 64);
    assert.ok(capturedCreateInput?.expiresAt instanceof Date);

    assert.equal(capturedSendInput?.email, "test@example.com");
    assert.ok(typeof capturedSendInput?.token === "string");
    assert.equal(capturedSendInput?.token.length, 64);
    assert.notEqual(capturedSendInput?.token, capturedCreateInput?.tokenHash);
    assert.equal(auditEvent?.event, "auth.password-reset.requested");
    assert.equal(auditEvent?.actorUserId, "user_123");
    assert.equal(auditEvent?.email, "test@example.com");
    assert.equal(auditEvent?.metadata?.outcome, "token_sent");
  } finally {
    forgotPasswordService.checkRateLimit = originalCheckRateLimit;
    forgotPasswordService.findUserByEmail = originalFindUserByEmail;
    forgotPasswordService.createPasswordResetToken = originalCreatePasswordResetToken;
    forgotPasswordService.sendResetInstructions = originalSendResetInstructions;
    forgotPasswordAudit.record = originalAuditRecord;
  }
});

test("requestPasswordResetAction maps unexpected failures", async () => {
  const originalCheckRateLimit = forgotPasswordService.checkRateLimit;
  const originalFindUserByEmail = forgotPasswordService.findUserByEmail;

  try {
    forgotPasswordService.checkRateLimit = async () => true;
    forgotPasswordService.findUserByEmail = async () => {
      throw new Error("boom");
    };

    const formData = new FormData();
    formData.set("email", "test@example.com");

    const result = await requestPasswordResetAction({ error: "", success: "" }, formData);

    assert.equal(
      result.error,
      "Unable to create password reset request right now. Please try again.",
    );
    assert.equal(result.success, "");
  } finally {
    forgotPasswordService.checkRateLimit = originalCheckRateLimit;
    forgotPasswordService.findUserByEmail = originalFindUserByEmail;
  }
});
