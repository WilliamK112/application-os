import assert from "node:assert/strict";
import test from "node:test";
import {
  resetPasswordAction,
  resetPasswordAudit,
  resetPasswordService,
} from "@/app/reset-password/actions";

test("resetPasswordAction validates passwords", async () => {
  const formData = new FormData();
  formData.set("token", "raw-token");
  formData.set("password", "short");
  formData.set("confirmPassword", "short");

  const result = await resetPasswordAction({ error: "", success: "" }, formData);

  assert.equal(result.error, "Password must be at least 8 characters.");
  assert.equal(result.success, "");
});

test("resetPasswordAction returns lockout error when rate limit is exceeded", async () => {
  const originalCheckRateLimit = resetPasswordService.checkRateLimit;

  try {
    resetPasswordService.checkRateLimit = async () => false;

    const formData = new FormData();
    formData.set("token", "raw-token");
    formData.set("password", "new-password-123");
    formData.set("confirmPassword", "new-password-123");

    const result = await resetPasswordAction({ error: "", success: "" }, formData);

    assert.equal(result.error, "Too many password reset attempts. Please wait a few minutes and try again.");
    assert.equal(result.success, "");
  } finally {
    resetPasswordService.checkRateLimit = originalCheckRateLimit;
  }
});

test("resetPasswordAction rejects invalid token", async () => {
  const originalCheckRateLimit = resetPasswordService.checkRateLimit;
  const originalFindTokenByHash = resetPasswordService.findTokenByHash;

  try {
    resetPasswordService.checkRateLimit = async () => true;
    resetPasswordService.findTokenByHash = async () => null;

    const formData = new FormData();
    formData.set("token", "missing-token");
    formData.set("password", "new-password-123");
    formData.set("confirmPassword", "new-password-123");

    const result = await resetPasswordAction({ error: "", success: "" }, formData);

    assert.equal(result.error, "This password reset link is invalid.");
    assert.equal(result.success, "");
  } finally {
    resetPasswordService.checkRateLimit = originalCheckRateLimit;
    resetPasswordService.findTokenByHash = originalFindTokenByHash;
  }
});

test("resetPasswordAction rejects expired token", async () => {
  const originalCheckRateLimit = resetPasswordService.checkRateLimit;
  const originalFindTokenByHash = resetPasswordService.findTokenByHash;

  try {
    resetPasswordService.checkRateLimit = async () => true;
    resetPasswordService.findTokenByHash = async () => ({
      id: "prt_123",
      userId: "user_123",
      expiresAt: new Date(Date.now() - 1_000),
      usedAt: null,
    });

    const formData = new FormData();
    formData.set("token", "expired-token");
    formData.set("password", "new-password-123");
    formData.set("confirmPassword", "new-password-123");

    const result = await resetPasswordAction({ error: "", success: "" }, formData);

    assert.equal(result.error, "This password reset link has expired.");
    assert.equal(result.success, "");
  } finally {
    resetPasswordService.checkRateLimit = originalCheckRateLimit;
    resetPasswordService.findTokenByHash = originalFindTokenByHash;
  }
});

test("resetPasswordAction rejects already-used token", async () => {
  const originalCheckRateLimit = resetPasswordService.checkRateLimit;
  const originalFindTokenByHash = resetPasswordService.findTokenByHash;

  try {
    resetPasswordService.checkRateLimit = async () => true;
    resetPasswordService.findTokenByHash = async () => ({
      id: "prt_123",
      userId: "user_123",
      expiresAt: new Date(Date.now() + 3_600_000),
      usedAt: new Date(),
    });

    const formData = new FormData();
    formData.set("token", "used-token");
    formData.set("password", "new-password-123");
    formData.set("confirmPassword", "new-password-123");

    const result = await resetPasswordAction({ error: "", success: "" }, formData);

    assert.equal(result.error, "This password reset link has already been used.");
    assert.equal(result.success, "");
  } finally {
    resetPasswordService.checkRateLimit = originalCheckRateLimit;
    resetPasswordService.findTokenByHash = originalFindTokenByHash;
  }
});

test("resetPasswordAction consumes token and updates password", async () => {
  const originalCheckRateLimit = resetPasswordService.checkRateLimit;
  const originalFindTokenByHash = resetPasswordService.findTokenByHash;
  const originalConsumeTokenAndUpdatePassword = resetPasswordService.consumeTokenAndUpdatePassword;
  const originalAuditRecord = resetPasswordAudit.record;

  try {
    let auditEvent:
      | {
          event: string;
          actorUserId?: string;
          metadata?: Record<string, unknown>;
        }
      | undefined;
    let consumeCallCount = 0;
    let capturedConsumeInput:
      | {
          tokenId: string;
          userId: string;
          passwordHash: string;
        }
      | undefined;

    resetPasswordService.checkRateLimit = async () => true;
    resetPasswordService.findTokenByHash = async () => ({
      id: "prt_123",
      userId: "user_123",
      expiresAt: new Date(Date.now() + 3_600_000),
      usedAt: null,
    });
    resetPasswordService.consumeTokenAndUpdatePassword = async (input) => {
      consumeCallCount += 1;
      capturedConsumeInput = input;
    };
    resetPasswordAudit.record = async (event) => {
      auditEvent = event as {
        event: string;
        actorUserId?: string;
        metadata?: Record<string, unknown>;
      };
    };

    const formData = new FormData();
    formData.set("token", "raw-valid-token");
    formData.set("password", "new-password-123");
    formData.set("confirmPassword", "new-password-123");

    const result = await resetPasswordAction({ error: "", success: "" }, formData);

    assert.equal(result.error, "");
    assert.equal(result.success, "Password updated successfully. Please sign in with your new password.");
    assert.equal(capturedConsumeInput?.tokenId, "prt_123");
    assert.equal(capturedConsumeInput?.userId, "user_123");
    assert.ok(typeof capturedConsumeInput?.passwordHash === "string");
    assert.ok((capturedConsumeInput?.passwordHash.length ?? 0) > 20);
    assert.notEqual(capturedConsumeInput?.passwordHash, "new-password-123");
    assert.equal(consumeCallCount, 1);
    assert.equal(auditEvent?.event, "auth.password-reset.completed");
    assert.equal(auditEvent?.actorUserId, "user_123");
    assert.equal(auditEvent?.metadata?.outcome, "success");
  } finally {
    resetPasswordService.checkRateLimit = originalCheckRateLimit;
    resetPasswordService.findTokenByHash = originalFindTokenByHash;
    resetPasswordService.consumeTokenAndUpdatePassword = originalConsumeTokenAndUpdatePassword;
    resetPasswordAudit.record = originalAuditRecord;
  }
});

test("resetPasswordAction maps unexpected failures", async () => {
  const originalCheckRateLimit = resetPasswordService.checkRateLimit;
  const originalFindTokenByHash = resetPasswordService.findTokenByHash;

  try {
    resetPasswordService.checkRateLimit = async () => true;
    resetPasswordService.findTokenByHash = async () => {
      throw new Error("boom");
    };

    const formData = new FormData();
    formData.set("token", "raw-valid-token");
    formData.set("password", "new-password-123");
    formData.set("confirmPassword", "new-password-123");

    const result = await resetPasswordAction({ error: "", success: "" }, formData);

    assert.equal(result.error, "Unable to reset password right now. Please try again.");
    assert.equal(result.success, "");
  } finally {
    resetPasswordService.checkRateLimit = originalCheckRateLimit;
    resetPasswordService.findTokenByHash = originalFindTokenByHash;
  }
});
