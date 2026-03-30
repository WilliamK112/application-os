import assert from "node:assert/strict";
import test from "node:test";
import { probeGreenhouseApplicationPage } from "@/lib/jobs/greenhouse-submit-client";
import { probeLeverApplicationPage } from "@/lib/jobs/lever-submit-client";

test("probeGreenhouseApplicationPage returns failed on non-200", async () => {
  const result = await probeGreenhouseApplicationPage(
    "https://boards.greenhouse.io/example/jobs/1",
    async () => new Response("not found", { status: 404 }),
    "Submit plan (greenhouse): required mappings ready.",
  );

  assert.equal(result.status, "failed");
  assert.equal(result.failureCategory, "http_failure");
  assert.match(result.message, /greenhouse request failed during live probe/i);
});

test("probeGreenhouseApplicationPage returns needs_manual on form signal", async () => {
  const result = await probeGreenhouseApplicationPage(
    "https://boards.greenhouse.io/example/jobs/1",
    async () => new Response("<html><body><form>Apply</form></body></html>", { status: 200 }),
    "Submit plan (greenhouse): required mappings ready.",
  );

  assert.equal(result.status, "needs_manual");
  assert.equal(result.failureCategory, "manual_handoff");
  assert.match(result.message, /form .* detected/i);
});

test("probeLeverApplicationPage returns failed when no form signal is found", async () => {
  const result = await probeLeverApplicationPage(
    "https://jobs.lever.co/example/1",
    async () => new Response("<html><body><h1>Careers</h1></body></html>", { status: 200 }),
    "Submit plan (lever): required mappings ready.",
  );

  assert.equal(result.status, "failed");
  assert.equal(result.failureCategory, "no_form");
  assert.match(result.message, /no .*application form signal/i);
});

test("probeLeverApplicationPage returns failed on fetch exception", async () => {
  const result = await probeLeverApplicationPage(
    "https://jobs.lever.co/example/1",
    async () => {
      throw new Error("network down");
    },
    "Submit plan (lever): required mappings ready.",
  );

  assert.equal(result.status, "failed");
  assert.equal(result.failureCategory, "network_failure");
  assert.match(result.message, /lever live probe network failure/i);
});

test("provider-specific wording overrides are surfaced by live probe clients", async () => {
  const greenhouseNoForm = await probeGreenhouseApplicationPage(
    "https://boards.greenhouse.io/example/jobs/2",
    async () => new Response("<html><body><h1>Careers</h1></body></html>", { status: 200 }),
    "Submit plan (greenhouse): required mappings ready.",
  );
  assert.equal(greenhouseNoForm.status, "failed");
  assert.match(
    greenhouseNoForm.message,
    /greenhouse page loaded but no application form signal was detected/i,
  );

  const greenhouseNeedsManual = await probeGreenhouseApplicationPage(
    "https://boards.greenhouse.io/example/jobs/2",
    async () => new Response("<html><body><form>Apply now</form></body></html>", { status: 200 }),
    "Submit plan (greenhouse): required mappings ready.",
  );
  assert.equal(greenhouseNeedsManual.status, "needs_manual");
  assert.match(
    greenhouseNeedsManual.message,
    /auto-submit remains in assisted mode until profile\/files are fully mapped/i,
  );

  const leverNoForm = await probeLeverApplicationPage(
    "https://jobs.lever.co/example/2",
    async () => new Response("<html><body><h1>Open roles</h1></body></html>", { status: 200 }),
    "Submit plan (lever): required mappings ready.",
  );
  assert.equal(leverNoForm.status, "failed");
  assert.match(
    leverNoForm.message,
    /no explicit application form signals were found in current markup/i,
  );

  const leverHttpFailure = await probeLeverApplicationPage(
    "https://jobs.lever.co/example/2",
    async () => new Response("down", { status: 503 }),
    "Submit plan (lever): required mappings ready.",
  );
  assert.equal(leverHttpFailure.status, "failed");
  assert.match(leverHttpFailure.message, /lever request failed during live probe/i);

  const greenhouseNetworkFailure = await probeGreenhouseApplicationPage(
    "https://boards.greenhouse.io/example/jobs/2",
    async () => {
      throw new Error("timeout");
    },
    "Submit plan (greenhouse): required mappings ready.",
  );
  assert.equal(greenhouseNetworkFailure.status, "failed");
  assert.match(greenhouseNetworkFailure.message, /greenhouse live probe network failure/i);
});
