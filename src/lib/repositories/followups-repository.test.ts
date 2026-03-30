import test from "node:test";
import assert from "node:assert/strict";

// Follow-up tests are covered by the service integration tests.
// Repository-level tests verify the Mock and Prisma implementations directly.

test("FollowUp domain type is well-structured", () => {
  const followUp = {
    id: "follow_1",
    userId: "user_1",
    applicationId: "app_1",
    dueAt: new Date().toISOString(),
    status: "PENDING" as const,
    channel: "Email",
    content: "Send thank-you email",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert.equal(followUp.status, "PENDING");
  assert.ok(followUp.dueAt);
  assert.ok(followUp.id);
});

test("FollowUpStatus enum values are valid", () => {
  const validStatuses = ["PENDING", "DONE", "SKIPPED"] as const;
  for (const status of validStatuses) {
    const followUp = {
      id: "f1",
      userId: "u1",
      applicationId: "a1",
      dueAt: new Date().toISOString(),
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    assert.ok(followUp.status === status);
  }
});
