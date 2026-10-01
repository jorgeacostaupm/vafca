import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
try {
  const { normalizeMatrixNetworks } = await server.ssrLoadModule("/src/utils/import/normalizeMatrixNetworks.ts");
  const { getNetworkValue, materializeNetworkMatrix, iterateNetworkEdges } = await server.ssrLoadModule("/src/utils/networkData.ts");
  const { createSelectedLinkDraft, getSelectedLinkRemovalIds } = await server.ssrLoadModule("/src/utils/selectedLinkKeys.ts");
  const { computeAggregatedNetworkData } = await server.ssrLoadModule("/src/networkDerivation/aggregation/nodeGroupAggregation.ts");
  const normalize = (data, layout = "full") => {
    const errors = [];
    const networks = normalizeMatrixNetworks({
      matrixFiles: [{ source: "matrix.json", payload: { id: "test", dimensions: {}, measure: "fc", source: "test", statistic: "value", data, layout } }],
      errors, warnings: [],
      inference: { generatedNetworkIds: [], inferredFields: [] },
    });
    return { networks, errors };
  };
  const values = [[0, 2, 4], [2, 0, 6], [4, 6, 0]];
  assert.deepEqual(normalize(values).errors, []);
  for (const layout of ["upper_triangular", "lower_triangular"]) {
    const packed = layout === "upper_triangular" ? [0, 2, 4, 0, 6, 0] : [0, 2, 0, 4, 6, 0];
    assert.deepEqual(normalize(packed, layout).networks[0].data, values);
  }
  for (const data of [[[0, 1], [2, 0]], [[0, null], [2, 0]]]) {
    const result = normalize(data);
    assert.equal(result.networks.length, 0);
    assert.equal(result.errors.length, 1);
  }
  assert.equal(normalize([[0, null], [null, 0]]).errors.length, 0);
  const network = { nodeIds: ["a", "b", "c"], data: { format: "matrix", layout: "full", values, missingValue: null } };
  assert.equal([...iterateNetworkEdges(network)].filter(edge => edge.sourceId !== edge.targetId).length, 3);
  const edgeList = { ...network, data: { format: "edge-list", edges: [{ sourceId: "a", targetId: "b", value: 2 }] } };
  assert.equal(getNetworkValue(edgeList, "b", "a"), 2);
  assert.equal(materializeNetworkMatrix(edgeList)[1][0], 2);
  const row = { id: "a", label: "A", index: 0 };
  const col = { id: "b", label: "B", index: 1 };
  assert.deepEqual(createSelectedLinkDraft({ row, col }), createSelectedLinkDraft({ row: col, col: row }));
  assert.deepEqual(getSelectedLinkRemovalIds("a", "b"), ["a::b", "b::a"]);
  const aggregated = computeAggregatedNetworkData({ baseNetwork: network, groups: [{ nodeIds: ["a", "b"] }, { nodeIds: ["c"] }] });
  assert.deepEqual(aggregated.data, [[2, 5], [5, null]]);
  assert.deepEqual(aggregated.cellCounts, [[1, 2], [2, 0]]);
  const { loadNetworkImportFromBytes } = await server.ssrLoadModule("/src/utils/import/loadNetworkImport.ts");
  for (const file of ["minimal_example.zip", "test_data.zip"]) {
    const bytes = readFileSync(`public/examples/${file}`);
    const result = await loadNetworkImportFromBytes(file, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    assert.deepEqual(result.normalized.issues.errors, [], file);
    assert.ok(result.dataset.networks.length > 0, file);
  }
  console.log("Undirected network checks passed (including example ZIP imports).");
} finally {
  await server.close();
}
