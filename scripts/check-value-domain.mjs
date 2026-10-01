import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
try {
  const { resolveValueDomain } = await server.ssrLoadModule("/src/utils/valueDomain.ts");
  const { resolveNetworkFilterRange } = await server.ssrLoadModule("/src/utils/edgeFilter.ts");
  const { loadNetworkImportFromBytes } = await server.ssrLoadModule("/src/utils/import/loadNetworkImport.ts");
  const bytes = readFileSync("public/examples/use_case_1.zip");
  const { dataset, normalized } = await loadNetworkImportFromBytes("use_case_1.zip", bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  assert.deepEqual(normalized.issues.errors, []);
  const pearson = dataset.networks.find(network => network.measureId === "pearson");
  const cicoh = dataset.networks.find(network => network.measureId === "cicoh");
  assert.ok(pearson && cicoh);
  const check = (network, catalogs, expected) => {
    for (const mode of ["shared", "view_observed"]) {
      const domain = resolveValueDomain({ network, catalogs, mode });
      assert.equal(domain.scaleType, expected);
      assert.equal(domain.center, expected === "diverging" ? 0 : null);
      assert.deepEqual(resolveNetworkFilterRange({ network, catalogs, mode }), {
        min: domain.min, max: domain.max, scaleType: expected,
      });
    }
  };
  check(pearson, dataset.catalogs, "diverging");
  check(cicoh, dataset.catalogs, "sequential");
  for (const [range, expected] of [
    [[0, 2], "sequential"], [[-2, 3], "diverging"],
    [[-2, 0], "sequential"], [[0, 0], "sequential"],
  ]) {
    const catalogs = structuredClone(dataset.catalogs);
    catalogs.statistics[pearson.statisticId].expectedRange = range;
    check(pearson, catalogs, expected);
    check(cicoh, catalogs, expected);
    const domain = resolveValueDomain({ network: pearson, catalogs, mode: "shared" });
    const local = resolveValueDomain({ network: pearson, catalogs, mode: "view_observed" });
    assert.deepEqual([domain.min, domain.max], [local.min, local.max]);
  }
  console.log("Value domain checks passed (use_case_1, statistic precedence, zero boundaries and filters).");
} finally {
  await server.close();
}
