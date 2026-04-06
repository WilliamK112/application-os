import assert from "node:assert/strict";
import test from "node:test";
import {
  getProviderAdapter,
  listRegisteredProviderAdapters,
} from "@/lib/jobs/provider-adapter-registry";

test("getProviderAdapter returns greenhouse adapter for greenhouse provider", () => {
  const adapter = getProviderAdapter("greenhouse");

  assert.ok(adapter);
  assert.equal(adapter?.provider, "greenhouse");
});

test("getProviderAdapter returns lever adapter for lever provider", () => {
  const adapter = getProviderAdapter("lever");

  assert.ok(adapter);
  assert.equal(adapter?.provider, "lever");
});

test("getProviderAdapter returns workday adapter for workday provider and null for unknown", () => {
  const adapter = getProviderAdapter("workday");

  assert.ok(adapter);
  assert.equal(adapter?.provider, "workday");
  assert.equal(getProviderAdapter("unknown"), null);
});

test("listRegisteredProviderAdapters returns currently registered adapters", () => {
  const adapters = listRegisteredProviderAdapters();
  const providers = adapters.map((adapter) => adapter.provider).sort();

  assert.deepEqual(providers, ["greenhouse", "lever", "workday"]);
});
