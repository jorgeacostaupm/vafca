import assert from "node:assert/strict";
import { configureStore } from "@reduxjs/toolkit";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { createServer } from "vite";
import * as THREE from "three";

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
try {
  const { populateSpatialLinks } = await server.ssrLoadModule('/src/components/selected-links/spatialLinks.ts');
  const { initialVisualizationUiState } = await server.ssrLoadModule('/src/store/slices/visualizationUi/visualizationUiTypes.ts');
  const style = initialVisualizationUiState.spatialVisualStyle;
  const group = new THREE.Group();
  const centers = new Map([['a', new THREE.Vector3()], ['b', new THREE.Vector3(1, 0, 0)]]);
  const { createSelectedLinkDraft, findSelectedLinkId } = await server.ssrLoadModule('/src/utils/selectedLinkKeys.ts');
  const matrixSelection = { ...createSelectedLinkDraft({
    row: { id: 'b', label: 'B', index: 0 }, col: { id: 'a', label: 'A', index: 1 },
  }), sources: [{ value: 2 }] };
  const selectedById = { [matrixSelection.id]: matrixSelection };
  assert.equal(matrixSelection.id, 'b::a');
  assert.equal(findSelectedLinkId(selectedById, 'a', 'b'), 'b::a', '3D click removes the ID stored by the matrix');
  assert.equal(findSelectedLinkId({}, 'a', 'b'), undefined);
  populateSpatialLinks(group, centers, [{ ...matrixSelection, id: 'a::b', rowId: 'a', colId: 'b' }],
    style, selectedById, '#f0b429', false, new THREE.Vector2(200, 200));
  assert.equal(group.children[0].material.color.getHexString(), 'f0b429', 'Reversed selection is highlighted in 3D');
  const { SPATIAL_EDGE_WIDTH, SPATIAL_EMPHASIS_WIDTH } = await server.ssrLoadModule('/src/config/ui.ts');
  assert.equal(group.children[0].material.linewidth, SPATIAL_EDGE_WIDTH * SPATIAL_EMPHASIS_WIDTH);
  group.children[0].geometry.dispose(); group.children[0].material.dispose(); group.clear();
  const { buildNetworkVisibleLinks: buildResult } = await server.ssrLoadModule("/src/components/network/views/networkVisibleLinks.ts");
  const buildNetworkVisibleLinks = (...args) => buildResult(...args).links;
  const { NETWORK_LINKS_3D_LIMIT } = await server.ssrLoadModule("/src/config/ui.ts");
  const filters = { measure: null, stat: null, percentLinkIds: null };
  const matrix = { type: "matrix", payload: {
    rowLabels: ["a", "b", "c"], colLabels: ["a", "b", "c"],
    data: [[1, 2, -3], [2, 1, 0], [-3, 0, NaN]],
  } };
  const rows = buildNetworkVisibleLinks(matrix, filters, "network", { a: "A" });
  assert.equal(rows.length, 2, "Exclude self-links, zero, NaN and symmetric duplicates");
  assert.equal(rows[0].rowLabel, "A");
  assert.equal(rows[0].sources[0].value, -3);
  assert.equal(buildNetworkVisibleLinks(matrix, { ...filters, stat: [1, 3] }, "network", {}).length, 1);
  assert.equal(buildNetworkVisibleLinks(matrix, { ...filters, percentLinkIds: new Set(["a::c"]) }, "network", {})[0].id, "a::c");
  const graph = { type: "node-link", payload: { labels: matrix.payload.rowLabels, data: matrix.payload.data } };
  assert.deepEqual(buildNetworkVisibleLinks(graph, filters, "network", { a: "A" }), rows);
  const rectangular = { type: "matrix", payload: { rowLabels: ["b"], colLabels: ["c", "a"], data: [[4, 2]] } };
  assert.deepEqual(buildNetworkVisibleLinks(rectangular, filters, "network", {}).map(row => row.id), ["b::c", "a::b"]);
  assert.equal(NETWORK_LINKS_3D_LIMIT, 500);
  for (const count of [0, 499, 500, 501, 600]) {
    const input = { type: "matrix", payload: { rowLabels: ["source"],
      colLabels: Array.from({ length: count }, (_, i) => `node-${i}`), data: [Array.from({ length: count }, (_, i) => (i % 2 ? -1 : 1) * (i + 1))] } };
    const result = buildNetworkVisibleLinks(input, filters, "network", {});
    assert.equal(buildResult(input, filters, "network", {}).isAutomaticallyFiltered, count > NETWORK_LINKS_3D_LIMIT);
    if (count > NETWORK_LINKS_3D_LIMIT) {
      const selected = { 'source::node-0': { rowId: 'source', colId: 'node-0' } };
      const retained = buildResult(input, filters, "network", {}, selected);
      assert.equal(retained.links.length, NETWORK_LINKS_3D_LIMIT + 1);
      assert.ok(retained.links.some(link => link.rowId === 'source' && link.colId === 'node-0'));
      assert.equal(retained.isAutomaticallyFiltered, count > NETWORK_LINKS_3D_LIMIT + 1);
      const allSelected = Object.fromEntries(input.payload.colLabels.map(id => [`source::${id}`, {}]));
      const all = buildResult(input, filters, "network", {}, allSelected);
      assert.equal(all.links.length, count);
      assert.equal(all.isAutomaticallyFiltered, false);
    }
    assert.equal(result.length, Math.min(count, NETWORK_LINKS_3D_LIMIT));
    assert.deepEqual(result.map(row => Math.abs(row.sources[0].value)),
      Array.from({ length: Math.min(count, NETWORK_LINKS_3D_LIMIT) }, (_, i) => count - i),
      "Keep the strongest absolute values, including links beyond the first 500");
    const filtered = buildNetworkVisibleLinks(input, { ...filters, stat: [1, count] }, "network", {});
    assert.equal(filtered.length, Math.ceil(count / 2), "Apply filters before the top-500 cap");
  }
  const { rootReducer } = await server.ssrLoadModule("/src/store/rootReducer.ts");
  const { default: SelectedLinksAtlas } = await server.ssrLoadModule("/src/components/selected-links/SelectedLinksAtlas.tsx");
  const initial = rootReducer(undefined, { type: "check/init" });
  const state = {
    ...initial,
    atlasDefinition: { ...initial.atlasDefinition, uploaded: { atlas: {
      id: "test", name: "Test", nodes: ["a", "b", "c"].map((id, index) => ({
        id, atlasId: id, index, name: id, label: id, metadata: {}, coords: { x: index, y: 0, z: 0 },
      })),
    } } },
    visualizationUi: { ...initial.visualizationUi, selectedLinks: [], atlasLinkIds: [],
      atlasPanel: { ...initial.visualizationUi.atlasPanel, spatialMode: "none", is3dAvailable: false },
    },
  };
  const store = configureStore({ reducer: rootReducer, preloadedState: state });
  const html = renderToStaticMarkup(createElement(Provider, { store },
    createElement(SelectedLinksAtlas, {
      networkLinks: rows, useAtlas3d: true, viewType: "circular", nodeMode: "connected",
      onViewTypeChange() {}, onNodeModeChange() {},
    }),
  ));
  assert.match(html, /network-links-3d__canvas/, "Local 3D renders even when global spatial mode is disabled");
  assert.match(html, /Showing 2 links/, "All visible links render with an empty global selection");
  assert.doesNotMatch(html, /selected-links-view-card/, "Network 3D has no inner card");
  const { default: NetworkSpatialControls } = await server.ssrLoadModule("/src/components/network/views/NetworkSpatialControls.tsx");
  for (const mode of ["geometry", "points"]) {
    const controls = renderToStaticMarkup(createElement(NetworkSpatialControls, {
      mode, hideInactiveRois: true, onModeChange() {}, onToggleInactiveRois() {}, onCameraPose() {},
    }));
    for (const label of ["Front", "Right", "Top", "Left"]) assert.ok(controls.includes(label));
    assert.equal(controls.includes('aria-label="Hide ROIs without visible links"'), mode === "geometry");
    if (mode === "geometry") assert.match(controls, /aria-pressed="true"/);
  }
  assert.equal(store.getState().visualizationUi.atlasPanel.spatialMode, "none");
  console.log("Network 3D links checks passed.");
} finally {
  await server.close();
}
