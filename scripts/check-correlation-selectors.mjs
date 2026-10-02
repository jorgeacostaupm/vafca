import { configureStore, createNextState } from '@reduxjs/toolkit';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const load = path => server.ssrLoadModule(`/src/${path}.ts`);
  const { calculateDerivedNetworks } = await load('networkDerivation/calculations/calculator');
  const { assertContextCompatible } = await load('networkDerivation/calculations/resolution');
  const { registerGeneratedNetworksInDataset } = await load('store/slices/dataset/utils/registerGeneratedNetworks');
  const { toDatasetNetworkSummary } = await load('utils/datasetAccessors');
  const { buildNetworkSummaryLabel } = await load('utils/matrixViewUtils');
  const { useNetworkFilterOptions } = await load('components/selectors/useNetworkFilterOptions');
  const { rootReducer } = await load('store/rootReducer');
  const { setDataset } = await load('store/slices/dataset/datasetSlice');
  const { patchNetworkControls, addNetworkView } = await load('store/slices/networkVisualization/networkVisualizationSlice');
  const { syncNetworkSelectedCompoundId } = await load('store/slices/networkVisualization/thunks/syncNetworkSelectedCompoundId');
  const { snapshotWorkspace, prepareWorkspace } = await load('workspace/state');
  const { encodeWorkspace, decodeWorkspace } = await load('workspace/archive');
  const { resolveValueDomain } = await load('utils/valueDomain');
  const { getRankingNetworkKind } = await load('utils/rankings/rankingNetworkMetadata');
  const { default: NetworkSelectorControls } = await server.ssrLoadModule('/src/components/selectors/NetworkSelectorControls.tsx');
  const entries = (...ids) => Object.fromEntries(ids.map(id => [id, { id, label: id }]));
  const base = {
    id: 'left', sourceId: 'controls', measureId: 'coherence', statisticId: 'mean',
    dimensions: { band: 'alpha', condition: 'rest' }, nodeSetId: 'atlas', nodeIds: ['a', 'b', 'c'],
    data: { format: 'matrix', layout: 'full', missingValue: null, values: [[null, 1, 2], [1, null, 3], [2, 3, null]] },
    provenance: { generatedBy: 'test', dependencies: [], parameters: {} },
  };
  const catalogs = {
    core: entries('source', 'measure', 'statistic'),
    sources: Object.fromEntries(['controls', 'patients'].map(id => [id, { id, label: id, kind: 'population' }])),
    measures: entries('coherence', 'plv'),
    statistics: Object.fromEntries(['mean', 'std'].map(id => [id, { id, label: id, scaleType: 'sequential', center: null, rangeMode: 'observed' }])),
    aspects: [{ id: 'band', label: 'Band' }, { id: 'condition', label: 'Condition' }],
    aspectCatalogs: { band: entries('alpha', 'beta'), condition: entries('rest', 'task') },
  };
  const dataset = {
    id: 'test', label: 'Test', catalogs,
    nodeSet: { id: 'atlas', label: 'Atlas', terminology: { singular: 'Node', plural: 'Nodes' },
      nodes: base.nodeIds.map((id, index) => ({ id, index, label: id, metadata: {} })) },
    networks: [base], networkIndex: { left: base },
  };
  const requestFor = (a, b) => ({ operations: ['correlation'], correlationNetworkAId: a, correlationNetworkBId: b, dimensionPairs: [], measureIds: [] });
  let registration = { catalogs: structuredClone(catalogs), networks: { ids: [], entities: {} } };
  const register = networks => { registration = createNextState(registration, draft => registerGeneratedNetworksInDataset(draft, networks)); };
  const calculate = (a, b) => {
    const state = { ...dataset, networks: [a, b], networkIndex: { [a.id]: a, [b.id]: b } };
    const result = calculateDerivedNetworks(requestFor(a.id, b.id), state);
    assert.deepEqual(result.warnings, []);
    assert.equal(result.networks.length, 1);
    return result.networks[0];
  };
  // Every independent combination of shared/different population, measure, statistic and two aspects.
  for (let bits = 0; bits < 32; bits++) {
    const right = { ...base, id: `right-${bits}`, sourceId: bits & 1 ? 'patients' : 'controls',
      measureId: bits & 2 ? 'plv' : 'coherence', statisticId: bits & 4 ? 'std' : 'mean',
      dimensions: { band: bits & 8 ? 'beta' : 'alpha', condition: bits & 16 ? 'task' : 'rest' } };
    const result = calculate(base, right);
    const reverse = calculate(right, base);
    assert.equal(result.id, reverse.id);
    assert.equal(result.sourceId, reverse.sourceId);
    assert.equal(result.measureId, reverse.measureId);
    assert.equal(result.statisticId, reverse.statisticId);
    assert.deepEqual(result.dimensions, reverse.dimensions);
    register([result]);
    const c = registration.catalogs;
    for (const [a, b, id, catalog] of [
      [base.sourceId, right.sourceId, result.sourceId, c.sources],
      [base.measureId, right.measureId, result.measureId, c.measures],
      ...Object.keys(base.dimensions).map(key => [base.dimensions[key], right.dimensions[key], result.dimensions[key], c.aspectCatalogs[key]]),
    ]) {
      if (a === b) assert.equal(id, a);
      else assert.deepEqual(catalog[id].comparison.values, [a, b].sort());
    }
    assert.notEqual(result.statisticId, right.statisticId);
    assert.deepEqual(c.statistics[result.statisticId].comparison.values, [base.statisticId, right.statisticId].sort());
    assert.equal(c.statistics[result.statisticId].comparison.operator, 'pearson_contribution');
    assert.deepEqual(result.derivation.inputs.map(input => input.dimensions), [base.dimensions, right.dimensions]);
    assert.equal(getRankingNetworkKind(result, { ...dataset, catalogs: c }), 'comparison');
    assert.equal(resolveValueDomain({ network: result, catalogs: c, mode: 'catalog' }).scaleType, 'diverging');
    if (bits & 2) assert.throws(() => assertContextCompatible([base, right]), /not compatible/);
    dataset.networks.push(right);
  }
  assert.equal(Object.keys(registration.catalogs.sources).length, 3, 'one reusable population pair');
  assert.equal(Object.keys(registration.catalogs.measures).length, 3, 'one reusable measure pair');
  assert.equal(Object.keys(registration.catalogs.statistics).length, 4, 'one output per input statistic pair');

  const patientBeta = { ...base, id: 'patient-beta', sourceId: 'patients', dimensions: { ...base.dimensions, band: 'beta' } };
  const controlBeta = { ...base, id: 'control-beta', dimensions: patientBeta.dimensions };
  const patientAlpha = { ...base, id: 'patient-alpha', sourceId: 'patients' };
  const first = calculate(base, patientBeta), second = calculate(controlBeta, patientAlpha);
  register([first, second]);
  assert.equal(first.sourceId, second.sourceId);
  assert.deepEqual(first.dimensions, second.dimensions);
  const summaries = [first, second].map(toDatasetNetworkSummary);
  assert.notEqual(summaries[0].compoundId, summaries[1].compoundId);
  assert.notEqual(buildNetworkSummaryLabel(summaries[0], catalogs), buildNetworkSummaryLabel(summaries[1], catalogs));
  dataset.catalogs = registration.catalogs;
  dataset.networks.push(patientBeta, controlBeta, patientAlpha, ...Object.values(registration.networks.entities));
  dataset.networkIndex = Object.fromEntries(dataset.networks.map(n => [n.id, n]));
  let options;
  function Probe() {
    options = useNetworkFilterOptions({ dataset: { content: dataset }, atlas: { order: [] }, summaries,
      sourceId: first.sourceId, measureId: first.measureId, statisticId: first.statisticId, aspectFilters: first.dimensions });
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  assert.equal(options.matches.length, 2);
  assert.equal(options.networkOptions.length, 2);
  assert.notEqual(options.networkOptions[0].label, options.networkOptions[1].label);
  assert.match(options.sourceOptions[0].label, /controls ↔ patients/);
  assert.match(options.statisticOptions[0].label, /Pearson contribution · mean/);
  assert.deepEqual(options.aspectOptions[0].options.map(item => item.label), ['alpha ↔ beta']);
  const store = configureStore({ reducer: rootReducer });
  store.dispatch(setDataset({ content: dataset }));
  store.dispatch(patchNetworkControls({ matrixSelectorMode: 'fields', sourceId: second.sourceId, measureId: second.measureId,
    statisticId: second.statisticId, aspectFilters: second.dimensions, selectedCompoundId: summaries[1].compoundId }));
  await store.dispatch(syncNetworkSelectedCompoundId({ matches: summaries })).unwrap();
  assert.equal(store.getState().networkVisualization.controls.selectedCompoundId, summaries[1].compoundId);
  assert.doesNotMatch(renderToStaticMarkup(createElement(Provider, { store }, createElement(NetworkSelectorControls))), /title="Network"/);
  store.dispatch(patchNetworkControls({ matrixSelectorMode: 'combined' }));
  assert.match(renderToStaticMarkup(createElement(Provider, { store }, createElement(NetworkSelectorControls))), /title="Network"/);
  store.dispatch(patchNetworkControls({ matrixSelectorMode: 'fields' }));
  store.dispatch(addNetworkView({ type: 'matrix', compoundId: summaries[1].compoundId, label: second.label,
    measureId: second.measureId, statisticId: second.statisticId }));
  const decoded = await decodeWorkspace(await encodeWorkspace(snapshotWorkspace(store.getState())));
  const decodedNetwork = decoded.dataset.networks.find(n => n.id === second.id);
  assert.ok(decodedNetwork, 'correlation must survive archive decoding');
  assert.equal(toDatasetNetworkSummary(decodedNetwork).compoundId, summaries[1].compoundId, 'archive preserves result identity');
  const restored = prepareWorkspace(decoded);
  const restoredNetwork = restored.dataset.networks.entities[second.id];
  assert.deepEqual(restoredNetwork.derivation.inputs, second.derivation.inputs);
  assert.equal(toDatasetNetworkSummary(restoredNetwork).compoundId, summaries[1].compoundId);
  assert.deepEqual(restored.dataset.catalogs.sources[second.sourceId].comparison, dataset.catalogs.sources[second.sourceId].comparison);
  assert.deepEqual(restored.dataset.catalogs.statistics[second.statisticId].comparison, dataset.catalogs.statistics[second.statisticId].comparison);
  assert.deepEqual(restored.dataset.catalogs.aspectCatalogs.band[second.dimensions.band].comparison, dataset.catalogs.aspectCatalogs.band[second.dimensions.band].comparison);
  const measurePair = Object.values(dataset.catalogs.measures).find(item => item.comparison);
  assert.deepEqual(restored.dataset.catalogs.measures[measurePair.id].comparison, measurePair.comparison);
  assert.equal(calculateDerivedNetworks(requestFor(patientAlpha.id, controlBeta.id), dataset).existing[0].id, second.id);
  console.log('Correlation selector checks passed: 32 combinations, reusable pairs, distinct crossings, selection and workspace ZIP round trip.');
} finally { await server.close(); }
