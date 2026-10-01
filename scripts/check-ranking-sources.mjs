import assert from "node:assert/strict";

import { areRankingSourcesCompatible } from "../src/utils/rankings/rankingSourceCompatibility.ts";

const dataset = {
  catalogs: {
    sources: {
      population: { kind: "population" },
      subject: { kind: "subject" },
      differenceA: { kind: "comparison" },
      differenceB: { kind: "comparison" },
    },
  },
};

assert.equal(areRankingSourcesCompatible(["population", "subject"], dataset), true);
assert.equal(areRankingSourcesCompatible(["differenceA", "differenceB"], dataset), true);
assert.equal(areRankingSourcesCompatible(["population", "differenceA"], dataset), false);
