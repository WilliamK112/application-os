import assert from "node:assert/strict";
import test from "node:test";
import { buildProviderSubmitPlan } from "@/lib/jobs/submit-plan";

test("buildProviderSubmitPlan reports missing fields", () => {
  const plan = buildProviderSubmitPlan("greenhouse", {
    fullName: "Alex",
    email: "alex@example.com",
  });

  assert.deepEqual(plan.missingFields, ["phone"]);
  assert.match(plan.summary, /missing fields/i);
});

test("buildProviderSubmitPlan ready when required fields exist", () => {
  const plan = buildProviderSubmitPlan("lever", {
    fullName: "Alex",
    email: "alex@example.com",
    phone: "+1-555-000-1111",
  });

  assert.deepEqual(plan.missingFields, []);
  assert.match(plan.summary, /ready/i);
});
