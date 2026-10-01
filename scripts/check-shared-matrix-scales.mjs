import assert from 'node:assert/strict';

import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { buildSharedMatrixDomains } = await server.ssrLoadModule('/src/utils/sharedMatrixDomains.ts');
  const { resolveValueDomain } = await server.ssrLoadModule('/src/utils/valueDomain.ts');
  const { selectSharedMatrixDomains } = await server.ssrLoadModule('/src/store/slices/networkVisualization/sharedMatrixDomainSelectors.ts');
  const network = (id, data, measureId = 'plv', statisticId = 'mean') => ({
    id, compoundId: id, sourceId: id, measureId, statisticId, dimensions: {}, data, symmetric: true,
  });
  const a = network('a', [[0.2, 0.4]]);
  const b = network('b', [[0.6, 0.8]]);
  const catalogs = { measures: { plv: { expectedRange: [0, 1] } }, statistics: { mean: { scaleType: 'sequential' }, z: { rangeMode: 'observed_symmetric' } } };
  const entries = [a, b, network('other-measure', [[10, 20]], 'other'), network('other-stat', [[2, 3]], 'plv', 'std'), network('missing', [[NaN, Infinity]])].map(network => ({ viewId: network.id, network }));
  const domains = buildSharedMatrixDomains(entries, catalogs);
  const range = domain => [domain.min, domain.max];
  assert.deepEqual(range(domains.a), [0.2, 0.8]);
  assert.deepEqual(domains.a, domains.b);
  assert.deepEqual(range(domains['other-measure']), [10, 20]);
  assert.deepEqual(range(domains['other-stat']), [2, 3]);
  assert.deepEqual(range(resolveValueDomain({ network: a, catalogs, mode: 'view_observed' })), [0.2, 0.4]);
  assert.deepEqual(range(buildSharedMatrixDomains(entries.filter(entry => entry.viewId !== 'b'), catalogs).a), [0.2, 0.4]);
  const diverging = buildSharedMatrixDomains([
    { viewId: 'z1', network: network('z1', [[-2, 1]], 'plv', 'z') },
    { viewId: 'z2', network: network('z2', [[-1, 5]], 'plv', 'z') },
  ], catalogs);
  assert.deepEqual(range(diverging.z1), [-5, 5]);
  assert.deepEqual(diverging.z1, diverging.z2);
  const flat = buildSharedMatrixDomains([{ viewId: 'flat', network: network('flat', [[0, 0]]) }], catalogs).flat;
  assert.ok(Number.isFinite(flat.min) && flat.min < flat.max);
  const empty = buildSharedMatrixDomains([{ viewId: 'empty', network: network('empty', [[NaN]]) }], catalogs).empty;
  assert.equal(empty.source, 'fallback');
  const views = Object.fromEntries(['a', 'b', 'hidden', 'circular', 'error'].map(id => [id, { id, type: 'matrix', status: 'ready', temporaryNetworkId: id }]));
  views.circular.type = 'circular';
  views.error.status = 'error';
  const temporary = { a, b, hidden: network('hidden', [[100]]), circular: network('circular', [[200]]), error: network('error', [[300]]) };
  const order = ['a', 'b', 'circular', 'error'];
  const { computeNetworkMatrixDataStats } = await server.ssrLoadModule('/src/utils/networkDataStats.ts');
  // Once loaded, scale changes must never read matrix cells again.
  for (const net of Object.values(temporary)) {
    net.dataStats = computeNetworkMatrixDataStats(net.data);
    net.data = new Proxy(net.data, { get() { throw new Error('Unexpected matrix scan'); } });
  }
  const state = {
    dataset: { id: null, label: null, nodeSet: null, catalogs: null, networks: { ids: [], entities: {} } },
    networkVisualization: { viewsOrder: order, viewsById: views, temporaryNetworksById: temporary },
    visualizationUi: { uiRangeMode: 'shared' },
  };
  const shared = selectSharedMatrixDomains(state);
  assert.deepEqual(Object.keys(shared), ['a', 'b']);
  assert.deepEqual(range(shared.a), [0.2, 0.8]);
  assert.deepEqual(selectSharedMatrixDomains({ ...state, visualizationUi: { uiRangeMode: 'view_observed' } }), {});
  assert.strictEqual(selectSharedMatrixDomains({ ...state, visualizationUi: { uiRangeMode: 'shared' } }), shared);
  const removed = { ...state, networkVisualization: { ...state.networkVisualization, viewsOrder: ['a'] } };
  assert.deepEqual(range(selectSharedMatrixDomains(removed).a), [0.2, 0.4]);
  const added = { ...state, networkVisualization: { ...state.networkVisualization, viewsOrder: [...order, 'hidden'] } };
  assert.deepEqual(range(selectSharedMatrixDomains(added).a), [0.2, 100]);
  assert.deepEqual(range(selectSharedMatrixDomains({ ...added, networkVisualization: { ...added.networkVisualization, viewsOrder: ['a', 'b'] } }).a), [0.2, 0.8]);
  assert.deepEqual(range(resolveValueDomain({ network: temporary.a, catalogs, mode: 'view_observed' })), [0.2, 0.4]);
  const { default: datasetReducer, setDataset } = await server.ssrLoadModule('/src/store/slices/dataset/datasetSlice.ts');
  const storedNetwork = {
    id: 'loaded', sourceId: 'loaded', measureId: 'plv', statisticId: 'mean', dimensions: {},
    nodeIds: ['x', 'y'], data: { format: 'matrix', layout: 'full', values: [[0.1, 0.3], [0.3, 0.9]], missingValue: null },
  };
  const loaded = datasetReducer(undefined, setDataset({ content: {
    id: 'dataset', label: 'Dataset', nodeSet: { nodes: [] }, catalogs, networks: [storedNetwork],
  } }));
  assert.equal(loaded.networks.entities.loaded.dataStats.allValues.min, 0.1);
  assert.equal(loaded.networks.entities.loaded.dataStats.allValues.max, 0.9);
  const { createNetworkCompoundId } = await server.ssrLoadModule('/src/utils/networkMetadata.ts');
  const loadedState = { ...state, dataset: loaded, networkVisualization: {
    ...state.networkVisualization, viewsOrder: ['loaded-view'], viewsById: {
      'loaded-view': { id: 'loaded-view', type: 'matrix', status: 'ready', compoundId: createNetworkCompoundId(storedNetwork) },
    },
  } };
  assert.deepEqual(range(selectSharedMatrixDomains(loadedState)['loaded-view']), [0.1, 0.9]);
  const { sessionSchema } = await server.ssrLoadModule('/src/workspace/sessionSchema.ts');
  const rangeModeSchema = sessionSchema.shape.visualizationUi.shape.uiRangeMode;
  assert.equal(rangeModeSchema.parse('shared'), 'shared');
  assert.equal(rangeModeSchema.parse('catalog'), 'view_observed');
  console.log('Shared matrix scale checks passed.');
} finally {
  await server.close();
}
