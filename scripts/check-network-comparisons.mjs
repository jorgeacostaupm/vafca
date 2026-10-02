import { configureStore } from '@reduxjs/toolkit';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { loadNetworkImportFromBytes } = await server.ssrLoadModule('/src/utils/import/loadNetworkImport.ts');
  const { calculateDerivedNetworks } = await server.ssrLoadModule('/src/networkDerivation/calculations/calculator.ts');
  const { getAvailableNetworkCalculations } = await server.ssrLoadModule('/src/networkDerivation/calculations/resolution.ts');
  const { networkDimensionContexts } = await server.ssrLoadModule('/src/networkDerivation/calculations/dimensions.ts');
  const { calculationPreview } = await server.ssrLoadModule('/src/components/calculations/calculationPreview.ts');
  const { resolveValueDomain } = await server.ssrLoadModule('/src/utils/valueDomain.ts');
  const { registerGeneratedNetworksInDataset } = await server.ssrLoadModule('/src/store/slices/dataset/utils/registerGeneratedNetworks.ts');
  const { createNetworkCompoundId } = await server.ssrLoadModule('/src/utils/networkMetadata.ts');
  const bytes = readFileSync('public/examples/use_case_1.zip');
  const { dataset, normalized } = await loadNetworkImportFromBytes('use_case_1.zip', bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  assert.deepEqual(normalized.issues.errors, []);
  assert.deepEqual(Object.fromEntries(Object.entries(dataset.catalogs.sources).map(([id, source]) => [id, source.n])),
    { controls: 35, ltle: 18, rtle: 16 });
  // Simulate missing sample sizes for the checks that exercise manual entry below.
  Object.values(dataset.catalogs.sources).forEach((source) => { delete source.n; });
  const dimensions = { modality: 'eeg', frequency_band: 'alpha' };
  const request = {
    operations: ['population_difference'], leftPopulationId: 'controls', rightPopulationId: 'ltle',
    dimensionPairs: [{ left: dimensions, right: dimensions }], measureIds: ['cicoh'],
  };
  const signed = calculateDerivedNetworks(request, dataset);
  assert.equal(signed.networks.length, 1);
  assert.deepEqual(signed.networks[0].dimensions, dimensions);
  assert.match(signed.networks[0].label, /Alpha/);
  const absolute = calculateDerivedNetworks({ ...request, absoluteDifference: true }, dataset).networks[0];
  assert.equal(absolute.statisticId, 'absolute_difference');
  assert.notEqual(absolute.id, signed.networks[0].id);
  signed.networks[0].data.values.forEach((row, i) => row.forEach((value, j) =>
    assert.equal(absolute.data.values[i][j], value === null ? null : Math.abs(value))));
  assert.match(absolute.derivation.formula, /^abs\(/);
  // Catalog registration must keep magnitudes sequential, including measures with negative ranges.
  const state = { catalogs: structuredClone(dataset.catalogs), networks: { ids: [], entities: {} } };
  registerGeneratedNetworksInDataset(state, [absolute]);
  for (const mode of ['catalog', 'view_observed']) {
    const domain = resolveValueDomain({ network: { ...absolute, measureId: 'pearson' }, catalogs: state.catalogs, mode });
    assert.equal(domain.scaleType, 'sequential');
    assert.equal(domain.min, 0);
  }
  const existing = { ...dataset, networkIndex: { ...dataset.networkIndex, [absolute.id]: absolute } };
  assert.equal(calculateDerivedNetworks({ ...request, absoluteDifference: true }, existing).existing.length, 1);
  assert.equal(calculateDerivedNetworks(request, existing).networks.length, 1);
  const withAbsolute = { ...existing, networks: [...dataset.networks, absolute] };
  assert.equal(calculationPreview({ ...request, absoluteDifference: true }, withAbsolute, getAvailableNetworkCalculations(dataset))[0].calculated, true);
  assert.equal(calculationPreview(request, withAbsolute, getAvailableNetworkCalculations(dataset))[0].calculated, false);
  assert.equal(calculationPreview({ ...request, rightPopulationId: 'rtle', absoluteDifference: true }, withAbsolute, getAvailableNetworkCalculations(dataset))[0].calculated, false);
  const cross = { ...request, rightPopulationId: 'controls', dimensionPairs: [{ left: dimensions, right: { ...dimensions, frequency_band: 'beta' } }] };
  const crossResult = calculateDerivedNetworks(cross, dataset);
  assert.equal(crossResult.networks.length, 1);
  assert.match(crossResult.networks[0].label, /Beta/);
  assert.deepEqual(crossResult.networks[0].derivation.parameters.rightDimensions, cross.dimensionPairs[0].right);
  const left = dataset.networkIndex[crossResult.networks[0].derivation.leftNetworkId];
  const right = dataset.networkIndex[crossResult.networks[0].derivation.rightNetworkId];
  assert.equal(crossResult.networks[0].data.values[0][1], left.data.values[0][1] - right.data.values[0][1]);
  // Property order must not change compatibility.
  assert.equal(calculateDerivedNetworks({ ...request, dimensionPairs: [{ left: { frequency_band: 'alpha', modality: 'eeg' }, right: dimensions }] }, dataset).networks.length, 1);
  for (const operation of ['population_cohens_d', 'population_welch_t', 'population_two_sample_z_test']) {
    const req = { ...request, operations: [operation] };
    assert.equal(calculateDerivedNetworks(req, dataset).networks.length, 0);
    assert.match(calculateDerivedNetworks(req, dataset).warnings.join(' '), /sample size/);
    for (const n of [0, 1, -2, 2.5, NaN, Infinity]) {
      assert.equal(calculateDerivedNetworks({ ...req, sampleSizes: { controls: n, ltle: 20 } }, dataset).networks.length, 0);
    }
    const withN = calculateDerivedNetworks({ ...req, sampleSizes: { controls: 30, ltle: 20 } }, dataset);
    assert.equal(withN.networks.length, 1);
    assert.equal(withN.networks[0].sourceId, signed.networks[0].sourceId);
    assert.notEqual(withN.networks[0].id, signed.networks[0].id);
    registerGeneratedNetworksInDataset(state, withN.networks);
    assert.equal(withN.networks[0].derivation.parameters.nLeft, 30);
    assert.equal(withN.networks[0].derivation.parameters.nRight, 20);
    assert.equal(dataset.catalogs.sources.controls.n, undefined);
    const preview = calculationPreview(req, dataset, getAvailableNetworkCalculations(dataset));
    assert.match(preview[0].status, /missing n/);
  }
  const catalogN = structuredClone(dataset);
  catalogN.catalogs.sources.controls.n = 30;
  catalogN.catalogs.sources.ltle.n = 20;
  assert.equal(calculateDerivedNetworks({ ...request, operations: ['population_welch_t'] }, catalogN).networks.length, 1);
  const subjectData = structuredClone(dataset);
  Object.values(subjectData.catalogs.sources).forEach((source) => { source.kind = 'subject'; });
  subjectData.networks = subjectData.networks.filter((network) => network.statisticId === 'mean');
  subjectData.networks.forEach((network) => { network.statisticId = 'value'; });
  subjectData.catalogs.statistics.value = { ...subjectData.catalogs.statistics.mean, id: 'value', label: 'Value' };
  const subjectRequest = { ...cross, operations: ['subject_difference'], subjectIds: ['controls'], rightSubjectId: 'controls', absoluteDifference: true };
  assert.equal(calculateDerivedNetworks(subjectRequest, subjectData).networks[0].statisticId, 'absolute_difference');
  const oneSource = { ...dataset, networks: dataset.networks.filter((network) => network.sourceId === 'controls') };
  assert.ok(getAvailableNetworkCalculations(oneSource).some((method) => method.id === 'population_difference'));
  assert.equal(calculateDerivedNetworks({ ...request, dimensionPairs: [{ left: { band: 'alpha' }, right: dimensions }] }, dataset).networks.length, 0);
  const reference = { ...request, operations: ['population_one_sample_z_test'], referencePopulationId: 'ltle', sampleSizes: { controls: 25 } };
  assert.equal(calculateDerivedNetworks({ ...reference, sampleSizes: {} }, dataset).networks.length, 0);
  assert.equal(calculateDerivedNetworks(reference, dataset).networks.length, 1);
  const oneSample = calculateDerivedNetworks(reference, dataset).networks[0];
  assert.equal(oneSample.sourceId, signed.networks[0].sourceId);
  registerGeneratedNetworksInDataset(state, [signed.networks[0], oneSample]);
  const comparisonSources = Object.values(state.catalogs.sources).filter((source) => source.kind === 'comparison');
  assert.equal(comparisonSources.length, 1);
  assert.equal(comparisonSources[0].label, `${dataset.catalogs.sources.controls.label} vs ${dataset.catalogs.sources.ltle.label}`);
  const registeredNetworks = Object.values(state.networks.entities);
  assert.equal(new Set(registeredNetworks.map(createNetworkCompoundId)).size, registeredNetworks.length);
  const legacyComparison = structuredClone(signed.networks[0]);
  delete legacyComparison.derivation.parameters.sourceGrouping;
  assert.equal(createNetworkCompoundId(signed.networks[0]), `${createNetworkCompoundId(legacyComparison)}::${signed.networks[0].id}`);
  for (const differentPair of [
    { ...request, leftPopulationId: 'ltle', rightPopulationId: 'controls' },
    { ...request, rightPopulationId: 'rtle' },
    { ...request, dimensionPairs: cross.dimensionPairs },
  ]) {
    assert.notEqual(calculateDerivedNetworks(differentPair, dataset).networks[0].sourceId, signed.networks[0].sourceId);
  }
  const sampleMean = dataset.networkIndex[oneSample.derivation.leftNetworkId].data.values[0][1];
  const nullMean = dataset.networkIndex[oneSample.derivation.rightNetworkId].data.values[0][1];
  const sigma = dataset.networkIndex[oneSample.derivation.parameters.referenceStdNetworkId].data.values[0][1];
  assert.equal(oneSample.data.values[0][1], (sampleMean - nullMean) / (sigma / 5));
  assert.equal(oneSample.derivation.operator, 'one_sample_z_test');
  assert.equal(oneSample.derivation.parameters.nTarget, 25);
  const largerSample = calculateDerivedNetworks({ ...reference, sampleSizes: { controls: 100 } }, dataset).networks[0];
  assert.equal(largerSample.data.values[0][1], 2 * oneSample.data.values[0][1]);
  const absent = { ...request, measureIds: ['pearson'] };
  assert.equal(calculateDerivedNetworks(absent, dataset).skipped.length, 1);
  const incompatible = structuredClone(dataset);
  incompatible.networks.find((network) => network.id === signed.networks[0].derivation.rightNetworkId).nodeIds.reverse();
  assert.equal(calculateDerivedNetworks(request, incompatible).skipped.length, 1);
  const ambiguous = { ...dataset, networks: [...dataset.networks, { ...left, id: 'duplicate' }] };
  assert.equal(calculateDerivedNetworks(request, ambiguous).skipped.length, 1);
  const missing = structuredClone(dataset);
  missing.networks.find((network) => network.id === left.id).data.values[0][1] = null;
  assert.equal(calculateDerivedNetworks({ ...request, absoluteDifference: true }, missing).networks[0].data.values[0][1], null);
  // No dimensions is a valid context, as is the older dimension named band.
  for (const dims of [{}, { band: 'alpha' }]) {
    const simple = structuredClone(dataset);
    simple.networks = simple.networks.filter((network) => network.dimensions.modality === 'eeg' && network.dimensions.frequency_band === 'alpha');
    simple.networks.forEach((network) => { network.dimensions = dims; });
    simple.catalogs.aspects = Object.keys(dims).map((id) => ({ id, label: id }));
    simple.catalogs.aspectCatalogs = dims.band ? { band: { alpha: { id: 'alpha', label: 'Alpha' } } } : {};
    assert.equal(calculateDerivedNetworks({ ...request, dimensionPairs: [{ left: dims, right: dims }] }, simple).networks.length, 1);
  }
  // Derive all existing matching contexts, skipping unavailable measures.
  const allPairs = networkDimensionContexts(dataset.networks).map((dimensions) => ({ left: dimensions, right: dimensions }));
  assert.equal(allPairs.length, 6);
  const batch = calculateDerivedNetworks({ ...request, dimensionPairs: allPairs, measureIds: ['pearson', 'cicoh'] }, dataset);
  assert.equal(batch.networks.length, 6);
  assert.equal(batch.skipped.length, 6);

  const availableRows = calculationPreview({ ...request, dimensionPairs: allPairs, measureIds: ['pearson', 'cicoh'] },
    dataset, getAvailableNetworkCalculations(dataset));
  assert.equal(availableRows.length, 6);
  assert.ok(availableRows.every((row) => row.status === 'ready'));
  assert.deepEqual(calculationPreview(request, incompatible, getAvailableNetworkCalculations(incompatible)), []);

  // Statistics with arbitrary IDs are explicit inputs, not inferred from labels or fixed names.
  const custom = structuredClone(dataset);
  custom.networks = custom.networks.filter((network) => network.dimensions.modality === 'eeg' &&
    network.dimensions.frequency_band === 'alpha' && ['controls', 'ltle'].includes(network.sourceId));
  custom.catalogs.statistics = {};
  custom.networks.forEach((network) => {
    const role = network.statisticId === 'mean' ? 'average' : 'deviation';
    network.statisticId = `${network.sourceId}_${role}`;
    custom.catalogs.statistics[network.statisticId] = { ...dataset.catalogs.statistics.mean,
      id: network.statisticId, label: network.statisticId };
  });
  for (const sourceId of ['controls', 'ltle']) {
    const network = structuredClone(custom.networks.find((item) => item.sourceId === sourceId));
    network.id = `${sourceId}_median`;
    network.statisticId = 'median';
    network.data.values = network.data.values.map((row) => row.map(() => sourceId === 'controls' ? 9 : 4));
    custom.networks.push(network);
  }
  custom.catalogs.statistics.median = { ...dataset.catalogs.statistics.mean, id: 'median', label: 'Median' };
  custom.networkIndex = Object.fromEntries(custom.networks.map((network) => [network.id, network]));
  const medianRequest = { ...request, inputStatistics: { population_difference: { leftValue: 'median', rightValue: 'median' } } };
  const median = calculateDerivedNetworks(medianRequest, custom).networks[0];
  assert.equal(median.data.values[0][1], 5);
  assert.match(median.label, /Median/);
  assert.deepEqual(median.derivation.parameters.inputStatistics, medianRequest.inputStatistics.population_difference);
  assert.match(calculationPreview(medianRequest, custom, getAvailableNetworkCalculations(custom))[0].inputs, /Median/);
  const customState = { catalogs: structuredClone(custom.catalogs), networks: { ids: [], entities: {} } };
  registerGeneratedNetworksInDataset(customState, [median]);
  assert.equal(resolveValueDomain({ network: median, catalogs: customState.catalogs, mode: 'view_observed' }).max, 5);
  const mapping = { leftMean: 'controls_average', rightMean: 'ltle_average', leftStd: 'controls_deviation', rightStd: 'ltle_deviation' };
  for (const operation of ['population_cohens_d', 'population_welch_t', 'population_two_sample_z_test']) {
    assert.ok(getAvailableNetworkCalculations(custom).some((method) => method.id === operation));
    const mapped = { ...request, operations: [operation], sampleSizes: { controls: 30, ltle: 20 }, inputStatistics: { [operation]: mapping } };
    const result = calculateDerivedNetworks(mapped, custom);
    assert.equal(result.networks.length, 1);
    const baseline = calculateDerivedNetworks({ ...mapped, inputStatistics: undefined }, dataset).networks[0];
    assert.deepEqual(result.networks[0].data.values, baseline.data.values);
    assert.deepEqual(result.networks[0].provenance.parameters.inputStatistics, mapping);
  }
  const mappedReference = { ...reference, inputStatistics: { population_one_sample_z_test: {
    targetMean: 'controls_average', referenceMean: 'ltle_average', referenceStd: 'ltle_deviation',
  } } };
  assert.deepEqual(calculateDerivedNetworks(mappedReference, custom).networks[0].data.values,
    calculateDerivedNetworks(reference, dataset).networks[0].data.values);
  const stdRequest = { ...request, inputStatistics: { population_difference: {
    leftValue: 'controls_deviation', rightValue: 'ltle_deviation',
  } } };
  const stdDifference = calculateDerivedNetworks(stdRequest, custom).networks[0];
  assert.equal(stdDifference.sourceId, median.sourceId);
  assert.notEqual(stdDifference.id, median.id);
  assert.notEqual(createNetworkCompoundId(stdDifference), createNetworkCompoundId(median));
  const invalidStatistic = { ...request, inputStatistics: { population_difference: { leftValue: 'missing', rightValue: 'median' } } };
  assert.equal(calculateDerivedNetworks(invalidStatistic, custom).networks.length, 0);
  assert.match(calculateDerivedNetworks(invalidStatistic, custom).warnings.join(' '), /Select a statistic/);
  for (const req of [request, reference, { ...request, operations: ['population_two_sample_z_test'], sampleSizes: { controls: 35, ltle: 18 } }]) {
    const signedNetwork = calculateDerivedNetworks(req, dataset).networks[0];
    const absoluteRequest = { ...req, absoluteDifference: true };
    const absoluteNetwork = calculateDerivedNetworks(absoluteRequest, dataset).networks[0];
    assert.equal(absoluteNetwork.statisticId, `absolute_${signedNetwork.statisticId}`);
    assert.match(absoluteNetwork.label, /absolute /);
    assert.match(absoluteNetwork.derivation.formula, /^abs\(/);
    assert.equal(absoluteNetwork.derivation.parameters.absoluteValue, true);
    assert.equal(absoluteNetwork.provenance.parameters.absoluteValue, true);
    signedNetwork.data.values.forEach((row, i) => row.forEach((value, j) =>
      assert.equal(absoluteNetwork.data.values[i][j], value === null ? null : Math.abs(value))));
    const registered = { catalogs: structuredClone(dataset.catalogs), networks: { ids: [], entities: {} } };
    registerGeneratedNetworksInDataset(registered, [signedNetwork, absoluteNetwork]);
    assert.equal(registered.catalogs.statistics[absoluteNetwork.statisticId].scaleType, 'sequential');
    assert.equal(registered.catalogs.statistics[signedNetwork.statisticId].scaleType, 'diverging');
    const preview = calculationPreview(absoluteRequest, dataset, getAvailableNetworkCalculations(dataset));
    assert.equal(preview[0].output, absoluteNetwork.statisticId);
    const previouslyCalculated = { ...dataset, networkIndex: { ...dataset.networkIndex, [signedNetwork.id]: signedNetwork } };
    assert.equal(calculateDerivedNetworks(absoluteRequest, previouslyCalculated).networks.length, 1);
    previouslyCalculated.networkIndex[absoluteNetwork.id] = absoluteNetwork;
    assert.equal(calculateDerivedNetworks(absoluteRequest, previouslyCalculated).existing.length, 1);
  }
  const { default: CalculationMethods } = await server.ssrLoadModule('/src/components/calculations/CalculationMethods.tsx');
  const { default: CalculationStatistics } = await server.ssrLoadModule('/src/components/calculations/CalculationStatistics.tsx');
  const uiState = { datasetOperations: { derivedCalculationStatus: 'idle', derivedCalculationError: null }, dataset: { ...dataset, networks: { ids: dataset.networks.map(({ id }) => id), entities: dataset.networkIndex } } };
  const store = configureStore({ reducer: () => uiState });
  const { computeDerivedNetworks } = await server.ssrLoadModule('/src/store/slices/dataset/thunks/computeDerivedNetworks.ts');
  const selectedRows = [availableRows[0], availableRows[2]];
  globalThis.window = { setTimeout };
  const selectionResult = await store.dispatch(computeDerivedNetworks(selectedRows.map((row) => row.request))).unwrap();
  assert.equal(selectionResult.networks.length, 2);
  assert.equal(selectionResult.skipped.length, 0);
  assert.deepEqual(selectionResult.networks.map((network) => network.dimensions),
    selectedRows.map((row) => row.request.dimensionPairs[0].left));
  assert.equal((await store.dispatch(computeDerivedNetworks([])).unwrap()).networks.length, 0);
  delete globalThis.window;
  const render = (component, props) => renderToStaticMarkup(createElement(Provider, { store }, createElement(component, props)));
  const { default: DerivedNetworksPanel } = await server.ssrLoadModule('/src/components/calculations/DerivedNetworksPanel.tsx');
  const panelHtml = render(DerivedNetworksPanel, {});
  assert.match(panelHtml, /Derive networks/);
  assert.match(panelHtml, /Preview/);
  assert.ok(panelHtml.indexOf('aria-label="Absolute value of the result"') < panelHtml.indexOf('<table'));
  assert.match(panelHtml, /compute-networks__derive-action/);
  assert.match(panelHtml, /compute-networks__comparison/);
  assert.match(panelHtml, />Aspects</);
  assert.doesNotMatch(panelHtml, /<th[^>]*>(Target|Control|Calculated)</);
  assert.doesNotMatch(panelHtml, /Input statistics<|Output stat<|Dimensions \(left/);
  assert.match(panelHtml, /type="checkbox"/);
  assert.ok(panelHtml.lastIndexOf('Derive (') > panelHtml.lastIndexOf('</table>'));
  assert.doesNotMatch(panelHtml, /skipped:/);
  assert.doesNotMatch(panelHtml, /role="dialog"/);
  const { default: CalculationInputs } = await server.ssrLoadModule('/src/components/calculations/CalculationInputs.tsx');
  for (const operation of ['population_difference', 'subject_difference', 'population_one_sample_z_test', 'population_two_sample_z_test']) {
    const html = render(CalculationInputs, { request: { ...reference, operations: [operation] }, onChange() {} });
    assert.doesNotMatch(html, /aria-label="Absolute value of the result"/);
    assert.match(html, /Connectivity measure/);
  }
  let changedRequest;
  const tabs = CalculationMethods({ methods: getAvailableNetworkCalculations(dataset), request,
    onChange(next) { changedRequest = next; }, children: createElement('span', null, 'Method controls') });
  assert.deepEqual(tabs.props.items.map(({ label }) => label), ['Difference', 'Correlation', 'One sample Z-score', 'Two sample Z-score']);
  tabs.props.onChange('zscore');
  assert.deepEqual(changedRequest.operations, ['population_one_sample_z_test']);
  tabs.props.onChange('two_sample_zscore');
  assert.deepEqual(changedRequest.operations, ['population_two_sample_z_test']);
  tabs.props.onChange('difference');
  assert.deepEqual(changedRequest.operations, ['population_difference']);
  const tabHtml = render(CalculationMethods, { methods: getAvailableNetworkCalculations(dataset), request,
    onChange() {}, children: createElement('span', null, 'Method controls') });
  assert.equal((tabHtml.match(/role="tab"/g) ?? []).length, 4);
  assert.doesNotMatch(tabHtml, /Cohen|Welch|Methods and input statistics/);
  const zMethod = getAvailableNetworkCalculations(dataset).find((method) => method.id === 'population_one_sample_z_test');
  const statisticsHtml = render(CalculationStatistics, { method: zMethod, request: reference, onChange() {} });
  for (const label of ['Sample mean', 'Reference mean', 'Known population std']) {
    assert.ok(statisticsHtml.includes(`aria-label="${zMethod.label}: ${label}"`));
  }
  console.log('Comparison checks passed: four method tabs, automatic contexts, custom statistics, use_case_1, sample sizes, absolute differences, provenance and invalid inputs.');
} finally {
  await server.close();
}
