import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { authOptions, loginAudit, loginRateLimitService } from "@/lib/auth/options";

type AuthorizeFn = (
  credentials?: Record<string, unknown>,
  request?: unknown,
) => Promise<{
  id: string;
  email: string;
  name: string;
  timezone?: string;
} | null>;

const credentialsProvider = authOptions.providers[0] as {
  options?: {
    authorize?: AuthorizeFn;
  };
};

const authorize = credentialsProvider.options?.authorize;

if (!authorize) {
  throw new Error("Credentials authorize function is missing from authOptions.");
}

test("credentials authorize locks out by email after repeated failed attempts", async () => {
  loginRateLimitService.resetStore();

  const originalFindUnique = prisma.user.findUnique;
  const originalUpdate = prisma.user.update;
  const originalAuditRecord = loginAudit.record;

  const validPasswordHash = hashPassword("correct-password-123");
  const updateCalls: Array<{ where: { id: string }; data: { lastLoginAt: Date } }> = [];
  const auditEvents: Array<{
    event: string;
    email?: string;
    ip?: string;
    metadata?: Record<string, string | number | boolean | null | undefined>;
  }> = [];

  try {
    (prisma.user.findUnique as unknown as (typeof prisma.user.findUnique)) = (async () => ({
      id: "user_1",
      email: "test@example.com",
      name: "Test User",
      timezone: "America/Chicago",
      passwordHash: validPasswordHash,
    })) as typeof prisma.user.findUnique;

    (prisma.user.update as unknown as (typeof prisma.user.update)) = (async (args) => {
      updateCalls.push(args as { where: { id: string }; data: { lastLoginAt: Date } });
      return { id: "user_1" } as never;
    }) as typeof prisma.user.update;

    loginAudit.record = (async (payload) => {
      auditEvents.push(payload as never);
    }) as typeof loginAudit.record;

    for (let i = 0; i < 5; i += 1) {
      const failed = await authorize(
        { email: "test@example.com", password: "wrong-password-123" },
        { headers: { "x-forwarded-for": "203.0.113.10" } },
      );
      assert.equal(failed, null);
    }

    const blocked = await authorize(
      { email: "test@example.com", password: "correct-password-123" },
      { headers: { "x-forwarded-for": "203.0.113.10" } },
    );

    assert.equal(blocked, null);
    assert.equal(updateCalls.length, 0);

    const rateLimitedEvent = auditEvents.at(-1);
    assert.equal(rateLimitedEvent?.event, "auth.login.failed");
    assert.equal(rateLimitedEvent?.email, "test@example.com");
    assert.equal(rateLimitedEvent?.ip, "203.0.113.10");
    assert.equal(rateLimitedEvent?.metadata?.outcome, "rate_limited");
  } finally {
    (prisma.user.findUnique as unknown as (typeof prisma.user.findUnique)) = originalFindUnique;
    (prisma.user.update as unknown as (typeof prisma.user.update)) = originalUpdate;
    loginAudit.record = originalAuditRecord;
    loginRateLimitService.resetStore();
  }
});

test("credentials authorize records invalid_payload audit event for malformed credentials", async () => {
  loginRateLimitService.resetStore();

  const originalFindUnique = prisma.user.findUnique;
  const originalUpdate = prisma.user.update;
  const originalAuditRecord = loginAudit.record;

  let findUniqueCalls = 0;
  let updateCalls = 0;
  const auditEvents: Array<{
    event: string;
    email?: string;
    ip?: string;
    metadata?: Record<string, string | number | boolean | null | undefined>;
  }> = [];

  try {
    (prisma.user.findUnique as unknown as (typeof prisma.user.findUnique)) = (async () => {
      findUniqueCalls += 1;
      return null as never;
    }) as typeof prisma.user.findUnique;

    (prisma.user.update as unknown as (typeof prisma.user.update)) = (async () => {
      updateCalls += 1;
      return { id: "unused" } as never;
    }) as typeof prisma.user.update;

    loginAudit.record = (async (payload) => {
      auditEvents.push(payload as never);
    }) as typeof loginAudit.record;

    const result = await authorize(
      { email: "not-an-email", password: "short" },
      { headers: { "x-forwarded-for": "203.0.113.55" } },
    );

    assert.equal(result, null);
    assert.equal(findUniqueCalls, 0);
    assert.equal(updateCalls, 0);

    assert.equal(auditEvents.length, 1);
    const invalidPayloadEvent = auditEvents[0];
    assert.equal(invalidPayloadEvent?.event, "auth.login.failed");
    assert.equal(invalidPayloadEvent?.email, undefined);
    assert.equal(invalidPayloadEvent?.ip, "203.0.113.55");
    assert.equal(invalidPayloadEvent?.metadata?.outcome, "invalid_payload");
  } finally {
    (prisma.user.findUnique as unknown as (typeof prisma.user.findUnique)) = originalFindUnique;
    (prisma.user.update as unknown as (typeof prisma.user.update)) = originalUpdate;
    loginAudit.record = originalAuditRecord;
    loginRateLimitService.resetStore();
  }
});

test("credentials authorize malformed payload audit falls back to unknown ip when x-forwarded-for is absent", async () => {
  loginRateLimitService.resetStore();

  const originalFindUnique = prisma.user.findUnique;
  const originalUpdate = prisma.user.update;
  const originalAuditRecord = loginAudit.record;

  let findUniqueCalls = 0;
  let updateCalls = 0;
  const auditEvents: Array<{
    event: string;
    email?: string;
    ip?: string;
    metadata?: Record<string, string | number | boolean | null | undefined>;
  }> = [];

  try {
    (prisma.user.findUnique as unknown as (typeof prisma.user.findUnique)) = (async () => {
      findUniqueCalls += 1;
      return null as never;
    }) as typeof prisma.user.findUnique;

    (prisma.user.update as unknown as (typeof prisma.user.update)) = (async () => {
      updateCalls += 1;
      return { id: "unused" } as never;
    }) as typeof prisma.user.update;

    loginAudit.record = (async (payload) => {
      auditEvents.push(payload as never);
    }) as typeof loginAudit.record;

    const result = await authorize({ email: "not-an-email", password: "short" }, { headers: {} });

    assert.equal(result, null);
    assert.equal(findUniqueCalls, 0);
    assert.equal(updateCalls, 0);

    assert.equal(auditEvents.length, 1);
    const invalidPayloadEvent = auditEvents[0];
    assert.equal(invalidPayloadEvent?.event, "auth.login.failed");
    assert.equal(invalidPayloadEvent?.email, undefined);
    assert.equal(invalidPayloadEvent?.ip, "unknown");
    assert.equal(invalidPayloadEvent?.metadata?.outcome, "invalid_payload");
  } finally {
    (prisma.user.findUnique as unknown as (typeof prisma.user.findUnique)) = originalFindUnique;
    (prisma.user.update as unknown as (typeof prisma.user.update)) = originalUpdate;
    loginAudit.record = originalAuditRecord;
    loginRateLimitService.resetStore();
  }
});

test("credentials authorize locks out by IP across different emails", async () => {
  loginRateLimitService.resetStore();

  const originalFindUnique = prisma.user.findUnique;
  const originalUpdate = prisma.user.update;
  const originalAuditRecord = loginAudit.record;

  const validPasswordHash = hashPassword("correct-password-123");
  const auditEvents: Array<{
    event: string;
    email?: string;
    ip?: string;
    metadata?: Record<string, string | number | boolean | null | undefined>;
  }> = [];

  try {
    (prisma.user.findUnique as unknown as (typeof prisma.user.findUnique)) = (async (args) => ({
      id: "user_2",
      email: (args as { where: { email: string } }).where.email,
      name: "Another User",
      timezone: "America/Chicago",
      passwordHash: validPasswordHash,
    })) as typeof prisma.user.findUnique;

    (prisma.user.update as unknown as (typeof prisma.user.update)) = (async () => ({
      id: "user_2",
    })) as typeof prisma.user.update;

    loginAudit.record = (async (payload) => {
      auditEvents.push(payload as never);
    }) as typeof loginAudit.record;

    const ip = "198.51.100.21";

    for (let i = 0; i < 5; i += 1) {
      const failed = await authorize(
        { email: `different-${i}@example.com`, password: "wrong-password-123" },
        { headers: { "x-forwarded-for": ip } },
      );
      assert.equal(failed, null);
    }

    const blocked = await authorize(
      { email: "allowed@example.com", password: "correct-password-123" },
      { headers: { "x-forwarded-for": ip } },
    );

    assert.equal(blocked, null);

    const rateLimitedEvent = auditEvents.at(-1);
    assert.equal(rateLimitedEvent?.event, "auth.login.failed");
    assert.equal(rateLimitedEvent?.email, "allowed@example.com");
    assert.equal(rateLimitedEvent?.ip, ip);
    assert.equal(rateLimitedEvent?.metadata?.outcome, "rate_limited");
  } finally {
    (prisma.user.findUnique as unknown as (typeof prisma.user.findUnique)) = originalFindUnique;
    (prisma.user.update as unknown as (typeof prisma.user.update)) = originalUpdate;
    loginAudit.record = originalAuditRecord;
    loginRateLimitService.resetStore();
  }
});

test("credentials authorize clears failure buckets on successful login", async () => {
  loginRateLimitService.resetStore();

  const originalFindUnique = prisma.user.findUnique;
  const originalUpdate = prisma.user.update;
  const originalAuditRecord = loginAudit.record;

  const validPasswordHash = hashPassword("correct-password-123");
  let updateCalls = 0;
  const auditEvents: Array<{
    event: string;
    actorUserId?: string;
    email?: string;
    ip?: string;
    metadata?: Record<string, string | number | boolean | null | undefined>;
  }> = [];

  try {
    (prisma.user.findUnique as unknown as (typeof prisma.user.findUnique)) = (async () => ({
      id: "user_3",
      email: "clear@example.com",
      name: "Clear User",
      timezone: "America/Chicago",
      passwordHash: validPasswordHash,
    })) as typeof prisma.user.findUnique;

    (prisma.user.update as unknown as (typeof prisma.user.update)) = (async () => {
      updateCalls += 1;
      return { id: "user_3" } as never;
    }) as typeof prisma.user.update;

    loginAudit.record = (async (payload) => {
      auditEvents.push(payload as never);
    }) as typeof loginAudit.record;

    const ip = "192.0.2.99";

    const failed1 = await authorize(
      { email: "clear@example.com", password: "wrong-password-123" },
      { headers: { "x-forwarded-for": ip } },
    );
    const failed2 = await authorize(
      { email: "clear@example.com", password: "wrong-password-123" },
      { headers: { "x-forwarded-for": ip } },
    );

    assert.equal(failed1, null);
    assert.equal(failed2, null);

    const success = await authorize(
      { email: "clear@example.com", password: "correct-password-123" },
      { headers: { "x-forwarded-for": ip } },
    );

    assert.equal(success?.id, "user_3");
    assert.equal(updateCalls, 1);

    const successEvent = auditEvents.find((entry) => entry.event === "auth.login.success");
    assert.equal(successEvent?.actorUserId, "user_3");
    assert.equal(successEvent?.email, "clear@example.com");
    assert.equal(successEvent?.ip, ip);
    assert.equal(successEvent?.metadata?.outcome, "success");

    for (let i = 0; i < 5; i += 1) {
      const failed = await authorize(
        { email: "clear@example.com", password: "wrong-password-123" },
        { headers: { "x-forwarded-for": ip } },
      );
      assert.equal(failed, null);
    }

    const blocked = await authorize(
      { email: "clear@example.com", password: "correct-password-123" },
      { headers: { "x-forwarded-for": ip } },
    );

    assert.equal(blocked, null);

    const rateLimitedEvent = auditEvents.at(-1);
    assert.equal(rateLimitedEvent?.event, "auth.login.failed");
    assert.equal(rateLimitedEvent?.metadata?.outcome, "rate_limited");
  } finally {
    (prisma.user.findUnique as unknown as (typeof prisma.user.findUnique)) = originalFindUnique;
    (prisma.user.update as unknown as (typeof prisma.user.update)) = originalUpdate;
    loginAudit.record = originalAuditRecord;
    loginRateLimitService.resetStore();
  }
});
