import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

test("hashPassword and verifyPassword accept valid password", () => {
  const hash = hashPassword("candidate123");
  assert.equal(verifyPassword("candidate123", hash), true);
});

test("verifyPassword rejects invalid password", () => {
  const hash = hashPassword("candidate123");
  assert.equal(verifyPassword("wrong-password", hash), false);
});

test("verifyPassword rejects malformed hash", () => {
  assert.equal(verifyPassword("candidate123", "malformed"), false);
});
