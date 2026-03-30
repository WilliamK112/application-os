import assert from "node:assert/strict";
import test from "node:test";
import { authAuditLogService, type AuthAuditEvent } from "@/lib/security/audit-log";

test.afterEach(() => {
  authAuditLogService.resetSink();
});

test("authAuditLogService.record writes structured payload", async () => {
  let captured: AuthAuditEvent | undefined;

  authAuditLogService.setSink({
    async write(event) {
      captured = event;
    },
  });

  await authAuditLogService.record({
    event: "auth.login.failed",
    email: "test@example.com",
    ip: "127.0.0.1",
    metadata: {
      reason: "invalid_credentials",
      rateLimited: false,
    },
  });

  assert.equal(captured?.event, "auth.login.failed");
  assert.equal(captured?.email, "test@example.com");
  assert.equal(captured?.ip, "127.0.0.1");
  assert.equal(typeof captured?.occurredAt, "string");
  assert.equal(captured?.metadata?.reason, "invalid_credentials");
  assert.equal(captured?.metadata?.rateLimited, false);
});

test("authAuditLogService.record is non-blocking when sink fails", async () => {
  authAuditLogService.setSink({
    async write() {
      throw new Error("sink unavailable");
    },
  });

  await assert.doesNotReject(async () => {
    await authAuditLogService.record({
      event: "auth.password-reset.completed",
      actorUserId: "user_123",
    });
  });
});
