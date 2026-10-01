import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { resolveComputedNetworkView } = await server.ssrLoadModule('/src/components/network/views/networkViewModel.ts');
  const { buildNetworkViewValueFilters, resolveViewVisibility } = await server.ssrLoadModule('/src/components/network/views/networkViewVisibility.ts');
  const labels = ['a', 'b', 'c'];
  const args = {
    networkView: { id: 'n', nodeIds: labels, data: [[0, 9, 4], [9, 0, 1], [4, 1, 0]], symmetric: true, measureId: 'fc', statisticId: 'value' },
    nodeOrderIds: labels, atlasOrderLength: 3, activeLabelIds: labels, matrixViewActiveLabelIds: labels,
    circularHierarchyCategoryOrder: {}, matrixHierarchyCategoryOrder: {}, dataset: null, uiRangeMode: 'view_observed',
  };
  for (const type of ['matrix', 'circular', 'classic', 'spatial']) {
    const compute = (settings) => resolveComputedNetworkView({ ...args, view: { id: 'v', type }, settings });
    const baseline = compute({});
    for (const mode of ['top', 'bottom']) {
      const settings = { percentLinkFilter: { mode, percent: 34, includeAutoconnections: false }, hideIsolatedNodes: false };
      const full = compute(settings);
      const zoomed = compute({ ...settings, zoomHistory: [null, { rows: ['b', 'c'], cols: ['b', 'c'] }], zoomIndex: 1 });
      assert.deepEqual(buildNetworkViewValueFilters(zoomed), buildNetworkViewValueFilters(full), `${type}: ${mode} uses the whole input`);
      assert.deepEqual(zoomed.valueDomain, baseline.valueDomain);
      assert.equal(zoomed.statSliderMax, 9);
      const range = compute({ ...zoomed.settings, statRange: [4, 9] });
      assert.deepEqual(range.valueDomain, baseline.valueDomain);
      assert.equal(resolveViewVisibility(range).linkIds.size, 0, `${type}: range excludes the zoomed low-value link`);
    }
  }
  console.log('View filter and color domain stability checks passed.');
} finally {
  await server.close();
}
