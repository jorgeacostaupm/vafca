import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { calculateCorrelation } = await server.ssrLoadModule('/src/networkDerivation/calculations/correlation.ts');
  const { calculateDerivedNetworks } = await server.ssrLoadModule('/src/networkDerivation/calculations/calculator.ts');
  const { registerGeneratedNetworksInDataset } = await server.ssrLoadModule('/src/store/slices/dataset/utils/registerGeneratedNetworks.ts');
  const network = (id, values) => ({ id, sourceId: id, measureId: 'connectivity', statisticId: 'value', dimensions: {}, nodeSetId: 'atlas', nodeIds: ['a', 'b', 'c'],
    data: { format: 'matrix', layout: 'full', missingValue: null, values: [[999, values[0], values[1]], [values[0], 999, values[2]], [values[1], values[2], 999]] } });
  const a = network('a', [1, 2, 3]);
  const b = network('b', [3, 2, 1]);
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);
  for (const [right, expected] of [[a, 1], [b, -1], [network('zero', [1, -2, 1]), 0]]) {
    const { data, summary } = calculateCorrelation(a, right);
    close(summary.r, expected);
    close(data[0][1] + data[0][2] + data[1][2], summary.r);
    assert.deepEqual(summary, { method: 'pearson', r: summary.r, totalLinks: 3, validLinks: 3, excludedLinks: 0 });
    assert.equal(data[0][0], null);
    assert.equal(data[0][1], data[1][0]);
  }
  for (const invalid of [null, NaN, Infinity, -Infinity, '2']) {
    const { data, summary } = calculateCorrelation(a, network('missing', [invalid, 2, 3]));
    assert.equal(summary.excludedLinks, 1);
    assert.equal(summary.validLinks, 2);
    assert.equal(data[0][1], null);
    assert.equal(data[1][0], null);
  }
  const numericFallback = network('fallback', [null, 2, 3]);
  numericFallback.data.missingValue = 0;
  assert.equal(calculateCorrelation(a, numericFallback).summary.excludedLinks, 1);
  assert.throws(() => calculateCorrelation(a, network('constant', [0.1, 0.1, 0.1])), /zero variance/);
  assert.throws(() => calculateCorrelation(a, network('missing', [null, null, 1])), /at least two/);
  assert.throws(() => calculateCorrelation(a, { ...b, nodeIds: ['b', 'a', 'c'] }), /not compatible/);
  close(calculateCorrelation(network('large', [-1e308, 0, 1e308]), network('large2', [-1e308, 0, 1e308])).summary.r, 1);
  const n68 = { ...a, nodeIds: Array.from({ length: 68 }, (_, i) => String(i)), data: { ...a.data, values: Array.from({ length: 68 }, (_, i) => Array.from({ length: 68 }, (_, j) => i + j)) } };
  assert.equal(calculateCorrelation(n68, n68).summary.totalLinks, 2278);
  const triangular = { ...a, data: { ...a.data, layout: 'upper_triangular', values: [999, 1, 2, 999, 3, 999] } };
  close(calculateCorrelation(a, triangular).summary.r, 1);
  const edges = { ...a, data: { format: 'edge-list', edges: [{ sourceId: 'b', targetId: 'a', value: 1 }, { sourceId: 'a', targetId: 'c', value: 2 }, { sourceId: 'c', targetId: 'b', value: 3 }] } };
  close(calculateCorrelation(a, edges).summary.r, 1);
  const state = { networks: [a, b], networkIndex: { a, b }, catalogs: { sources: { a: { label: 'A' }, b: { label: 'B' } }, measures: {}, statistics: {}, aspects: [], aspectCatalogs: {} } };
  const request = { operations: ['correlation'], correlationNetworkAId: 'a', correlationNetworkBId: 'b', dimensionPairs: [], measureIds: [] };
  const result = calculateDerivedNetworks(request, state);
  assert.equal(result.networks.length, 1);
  const derived = result.networks[0];
  close(derived.derivation.parameters.r, -1);
  const registration = { catalogs: structuredClone(state.catalogs), networks: { ids: [], entities: {} } };
  registerGeneratedNetworksInDataset(registration, [derived]);
  assert.equal(registration.catalogs.statistics[derived.statisticId].scaleType, 'diverging');
  assert.equal(registration.catalogs.sources[derived.sourceId].kind, 'comparison');
  assert.equal(calculateDerivedNetworks(request, { ...state, networkIndex: { ...state.networkIndex, [derived.id]: derived } }).existing.length, 1);
  const constant = network('b', [1, 1, 1]);
  const rejected = calculateDerivedNetworks(request, { ...state, networkIndex: { a, b: constant } });
  assert.equal(rejected.networks.length, 0);
  assert.match(rejected.warnings.join(' '), /zero variance/);
  const { networkTooltipValue } = await server.ssrLoadModule('/src/components/common/networkTooltipValue.ts');
  const { formatHeatmapTooltipHtml } = await server.ssrLoadModule('/src/components/matrix/matrixTooltip.ts');
  const formatter = networkTooltipValue({ ...state, networkIndex: { ...state.networkIndex, [derived.id]: derived } }, derived.id, derived.label);
  const html = formatHeatmapTooltipHtml('<ROI A>', 'ROI B', derived.data.values[0][1], formatter, 'a', 'b');
  assert.match(html, /&lt;ROI A&gt;/);
  assert.match(html, /Correlation contribution: -/);
  assert.match(html, /Network A value: 1/);
  assert.match(html, /Network B value: 3/);
  const existingState = { ...state, networkIndex: { a, b, [derived.id]: derived } };
  for (const inputs of [request, { ...request, correlationNetworkAId: 'b', correlationNetworkBId: 'a' }]) {
    const repeated = calculateDerivedNetworks(inputs, existingState);
    assert.equal(repeated.networks.length, 0);
    assert.equal(repeated.existing[0].id, derived.id);
    assert.match(repeated.warnings.join(' '), /already been calculated/);
  }
  console.log('Correlation checks passed, including duplicate notifications in either direction.');
} finally { await server.close(); }
