import assert from "node:assert/strict";

import { reconcileNetworkFilters } from "../src/components/selectors/reconcileNetworkFilters.ts";

const summary = (sourceId, measureId, statisticId, band, session) => ({
  sourceId, measureId, statisticId, dimensions: { band, session },
});
const summaries = [
  summary("control", "plv", "mean", "alpha", "before"),
  summary("study", "plv", "mean", "alpha", "before"),
  summary("study", "ciplv", "mean", "alpha", "before"),
  summary("study", "plv", "std", "alpha", "before"),
  summary("study", "plv", "mean", "beta", "after"),
  summary("comparison", "plv", "zscore", "alpha", "before"),
  summary("other", "correlation", "mean", "alpha", "before"),
];
const filters = {
  sourceId: "control", measureId: "plv", statisticId: "mean",
  aspectFilters: { band: "alpha", session: "before" },
};
const reconcile = (patch) => reconcileNetworkFilters(
  { ...filters, ...patch }, summaries, ["band", "session"],
);

for (const patch of [
  { sourceId: "study" },
  { sourceId: "study", measureId: "ciplv" },
  { sourceId: "study", statisticId: "std" },
]) assert.deepEqual(reconcile(patch), { ...filters, ...patch });

assert.deepEqual(reconcile({ sourceId: "comparison" }), {
  ...filters, sourceId: "comparison", statisticId: "", aspectFilters: {},
});
assert.deepEqual(reconcile({ sourceId: "other" }), {
  sourceId: "other", measureId: "", statisticId: "", aspectFilters: {},
});
assert.deepEqual(reconcile({ sourceId: "" }), {
  sourceId: "", measureId: "", statisticId: "", aspectFilters: {},
});
assert.deepEqual(reconcile({
  sourceId: "study", aspectFilters: { band: "beta", session: "before" },
}).aspectFilters, { band: "beta" });
assert.deepEqual(reconcile({
  aspectFilters: { band: "beta", session: "before" },
}).aspectFilters, { session: "before" });
assert.deepEqual(filters.aspectFilters, { band: "alpha", session: "before" });
console.log("Network filter checks passed.");
