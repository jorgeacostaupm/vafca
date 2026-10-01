import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
try {
  const { resolveComputedNetworkView } = await server.ssrLoadModule("/src/components/network/views/networkViewModel.ts");
  const networkView = {
    id: "network", compoundId: "network", measureId: "fc", statisticId: "value",
    nodeIds: ["c", "a", "b"], symmetric: true,
    data: [[0, 4, 6], [4, 0, 2], [6, 2, 0]],
  };
  const sourceNetwork = { ...networkView };
  const args = {
    networkView,
    nodeOrderIds: ["a", "b", "c", "other"], atlasOrderLength: 4,
    activeLabelIds: ["a", "c", "other"], matrixViewActiveLabelIds: ["c", "a", "other"],
    circularHierarchyCategoryOrder: {}, matrixHierarchyCategoryOrder: {},
    dataset: { content: { networkIndex: { network: sourceNetwork } } }, uiRangeMode: "observed",
  };
  for (const type of ["matrix", "circular", "classic"]) {
    const view = { id: "view", type, compoundId: "network" };
    const computed = resolveComputedNetworkView({ ...args, view });
    const expectedLabels = type === "matrix" ? ["c", "a"] : ["a", "c"];
    assert.deepEqual(computed.rowLabels, expectedLabels, type);
    assert.deepEqual(computed.colLabels, expectedLabels, type);
    assert.deepEqual(computed.availableLabels, expectedLabels, type);
    assert.deepEqual(computed.data, [[0, 4], [4, 0]], type);

    const empty = resolveComputedNetworkView({ ...args, view, activeLabelIds: [], matrixViewActiveLabelIds: [] });
    assert.deepEqual(empty.data, [], `${type}: all nodes disabled`);
    assert.deepEqual(empty.rowLabels, []);

    const local = resolveComputedNetworkView({ ...args, view, settings: { labels: ["b", "c"] } });
    assert.deepEqual(local.rowLabels, ["c"], `${type}: local selection cannot restore disabled nodes`);

    const temporary = resolveComputedNetworkView({
      ...args, dataset: null, view: { ...view, temporaryNetworkId: "temporary" },
      activeLabelIds: [], matrixViewActiveLabelIds: [],
    });
    assert.deepEqual(temporary.rowLabels, networkView.nodeIds, `${type}: temporary group IDs remain independent`);

    const aggregated = resolveComputedNetworkView({
      ...args, view,
      dataset: { content: { networkIndex: { network: {
        ...sourceNetwork,
        derivation: { type: "aggregation", fields: [], groups: networkView.nodeIds.map(id => ({ id, label: id, criteria: {} })) },
      } } } },
      activeLabelIds: [], matrixViewActiveLabelIds: [],
    });
    assert.deepEqual(aggregated.rowLabels, ["a", "b", "c"], `${type}: aggregated group IDs remain independent`);
  }
  console.log("Network node visibility checks passed.");
} finally {
  await server.close();
}
