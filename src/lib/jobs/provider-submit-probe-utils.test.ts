import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProbeFormDetectedNeedsManualResult,
  buildProbeHttpFailureResult,
  buildProbeNetworkFailureResult,
  buildProbeNoFormSignalResult,
  hasApplicationFormSignal,
} from "@/lib/jobs/provider-submit-probe-utils";

test("hasApplicationFormSignal detects common apply markers", () => {
  assert.equal(hasApplicationFormSignal("<button>Apply Now</button>"), true);
  assert.equal(hasApplicationFormSignal("<section>application details</section>"), true);
  assert.equal(hasApplicationFormSignal("<form></form>"), true);
  assert.equal(hasApplicationFormSignal("<div>careers</div>"), false);
});

test("probe template builders return provider-aware messages", () => {
  const plan = "Submit plan (greenhouse): required mappings ready.";

  const httpFailure = buildProbeHttpFailureResult("greenhouse", 503, plan);
  assert.equal(httpFailure.status, "failed");
  assert.match(httpFailure.message, /greenhouse page request failed with http 503/i);

  const noForm = buildProbeNoFormSignalResult("lever", plan);
  assert.equal(noForm.status, "failed");
  assert.match(noForm.message, /lever page loaded but no application form signal/i);

  const needsManual = buildProbeFormDetectedNeedsManualResult("greenhouse", plan);
  assert.equal(needsManual.status, "needs_manual");
  assert.match(needsManual.message, /manual submission still required/i);

  const networkFailure = buildProbeNetworkFailureResult(
    "lever",
    new Error("network down"),
    plan,
  );
  assert.equal(networkFailure.status, "failed");
  assert.match(networkFailure.message, /lever external submit probe failed: network down/i);
});

test("provider wording overrides do not change status taxonomy", () => {
  const plan = "Submit plan (lever): required mappings ready.";

  const httpFailure = buildProbeHttpFailureResult("lever", 429, plan, {
    httpFailurePrefix: "lever rate-limited during probe.",
  });
  assert.equal(httpFailure.status, "failed");
  assert.match(httpFailure.message, /lever rate-limited during probe/i);

  const noForm = buildProbeNoFormSignalResult("greenhouse", plan, {
    noFormSignalText: "greenhouse page loaded but form markers are absent.",
  });
  assert.equal(noForm.status, "failed");
  assert.match(noForm.message, /form markers are absent/i);

  const needsManual = buildProbeFormDetectedNeedsManualResult("lever", plan, {
    needsManualText: "lever form found; keep assisted mode pending mapped file uploads.",
  });
  assert.equal(needsManual.status, "needs_manual");
  assert.match(needsManual.message, /keep assisted mode/i);

  const networkFailure = buildProbeNetworkFailureResult(
    "greenhouse",
    new Error("timeout"),
    plan,
    {
      networkFailurePrefix: "greenhouse probe transport error: timeout.",
    },
  );
  assert.equal(networkFailure.status, "failed");
  assert.match(networkFailure.message, /probe transport error: timeout/i);
});
