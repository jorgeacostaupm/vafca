import { configureStore } from '@reduxjs/toolkit';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const load = path => server.ssrLoadModule(`/src/${path}.ts`);
  const { rootReducer } = await load('store/rootReducer');
  const { setDataset, updateCatalogItem } = await load('store/slices/dataset/datasetSlice');
  const { selectDatasetContent, selectMaterializedNetworkByCompoundId } = await load('store/slices/dataset/datasetSelectors');
  const { updateCatalogItemAndPruneActiveNetworks: apply } = await load('store/workflows/updateCatalogItemAndPruneActiveNetworks');
  const { addNetworkView, removeNetworkView, addTemporaryAggregatedNetworkView } = await load('store/slices/networkVisualization/networkVisualizationSlice');
  const { selectNetworkViewWithCurrentLabel: selectView } = await load('store/slices/networkVisualization/networkVisualizationSelectors');
  const { createNetworkCompoundId } = await load('utils/networkMetadata');
  const { buildNetworkSummaryLabel } = await load('utils/matrixViewUtils');
  const { networkTooltipValue } = await load('components/common/networkTooltipValue');
  const { formatNetworkFilterOptionLabel } = await load('components/network/edge-filter/edgeFilterLabels');
  const { getRankingDimensions, getRankingDimensionValue } = await load('utils/rankings/rankingPresentation');
  const { formatRankingPanelTitle } = await load('components/rankings/rankingOptions');
  const { buildNetworkSummaryLabelMap, buildNetworkColumns, buildExportPayload } = await load('components/selected-links/selectedLinksPanel.utils');
  const { viewsSchema } = await load('workspace/viewSchema');
  const network = {
    id: 'network', sourceId: 's', measureId: 'm', statisticId: 'mean',
    dimensions: { band: 'a', condition: 'a' }, nodeSetId: 'atlas', nodeIds: ['x', 'y'],
    data: { format: 'matrix', layout: 'full', values: [[0, 0.5], [0.5, 0]], missingValue: null },
  };
  const dataset = {
    id: 'dataset', label: 'Dataset',
    nodeSet: { id: 'atlas', label: 'Atlas', nodes: ['x', 'y'].map((id, index) => ({ id, index, label: id })) },
    catalogs: {
      core: { source: { id: 'source', label: 'Population' } },
      sources: { s: { id: 's', label: 'Population', kind: 'population' } },
      measures: { m: { id: 'm', label: 'Measure' } },
      statistics: { mean: { id: 'mean', label: 'Mean' } },
      aspects: [{ id: 'band', label: 'Band' }, { id: 'condition', label: 'Condition' }],
      aspectCatalogs: { band: { a: { id: 'a', label: 'Alpha' } }, condition: { a: { id: 'a', label: 'Rest' } } },
    },
    networks: [network], networkIndex: { network },
  };
  const store = configureStore({ reducer: rootReducer });
  store.dispatch(setDataset({ content: dataset }));
  const compoundId = createNetworkCompoundId(network);
  const originalLabel = buildNetworkSummaryLabel(network, dataset.catalogs);
  const viewIds = ['matrix', 'circular', 'classic'].map(type => {
    store.dispatch(addNetworkView({ type, compoundId, label: originalLabel, measureId: 'm', statisticId: 'mean' }));
    return store.getState().networkVisualization.viewsOrder[0];
  });
  store.dispatch(addTemporaryAggregatedNetworkView({
    viewId: 'aggregate', temporaryNetworkId: 'temporary', sourceCompoundId: compoundId,
    type: 'matrix', label: `${originalLabel} aggregated`, measureId: 'm', statisticId: 'mean', loadingMessage: 'Loading',
  }));
  const matrix = selectMaterializedNetworkByCompoundId(store.getState(), compoundId);
  const settings = store.getState().networkVisualization.matrixSettingsByViewId;
  const expected = ['Population', 'Measure', 'Mean', 'Alpha', 'Rest'];
  const query = { target: 'networks', measureId: 'm' };
  for (const [index, update, label] of [
    [0, { catalog: 'sources', id: 's' }, 'New · population'],
    [1, { catalog: 'measures', id: 'm' }, 'New measure'],
    [2, { catalog: 'statistics', id: 'mean' }, 'New statistic'],
    [3, { catalog: 'aspectCatalogs', aspectId: 'band', id: 'a' }, 'New band'],
    [4, { catalog: 'aspectCatalogs', aspectId: 'condition', id: 'a' }, 'New condition'],
  ]) {
    await store.dispatch(apply({ ...update, changes: { label } })).unwrap();
    expected[index] = label;
    const state = store.getState();
    const content = selectDatasetContent(state);
    const title = expected.join(' · ');
    for (const id of viewIds) {
      assert.equal(selectView(state, id).label, title, 'all view types update, including loading views');
      assert.equal(selectView(state, id), selectView(state, id), 'selector reference stays stable');
    }
    assert.equal(selectView(state, 'aggregate').label, `${title} aggregated`);
    assert.equal(selectMaterializedNetworkByCompoundId(state, compoundId), matrix, 'renaming does not rematerialize data');
    assert.equal(state.networkVisualization.matrixSettingsByViewId, settings, 'renaming preserves view settings');
    for (const id of [network.id, compoundId]) {
      assert.equal(networkTooltipValue(content, id, originalLabel), `${expected[1]} · ${expected[2]}`, 'existing annotations use current labels');
    }
    assert.equal(formatNetworkFilterOptionLabel(network, content.catalogs), title);
    assert.equal(formatRankingPanelTitle({ query }, content), `Network Ranking · ${expected[1]}`);
    const dimensions = getRankingDimensions(query, content);
    assert.equal(dimensions[0].labelFor('s'), expected[0]);
    assert.equal(dimensions[1].labelFor('a'), expected[3]);
    assert.equal(getRankingDimensionValue({ type: 'link', bestNetworkId: network.id, nNetworksUsed: 1 }, 'band', query, content), expected[3]);
    const labelMap = buildNetworkSummaryLabelMap([{ value: compoundId, label: buildNetworkSummaryLabel(network, content.catalogs) }]);
    const columns = buildNetworkColumns([compoundId], labelMap, new Map([[compoundId, originalLabel]]));
    assert.equal(columns[0].label, title, 'selected link columns override stored labels');
    assert.equal(buildExportPayload('all', [compoundId], id => labelMap[id], []).networks[0].label, title);
  }
  store.dispatch(removeNetworkView({ viewId: viewIds[0] }));
  store.dispatch(updateCatalogItem({ catalog: 'sources', id: 's', changes: { label: 'After closing source' } }));
  assert.match(selectView(store.getState(), 'aggregate').label, /^After closing source/, 'aggregate titles survive source-view removal');
  const restored = viewsSchema.parse(store.getState().networkVisualization);
  assert.equal(restored.viewsById.aggregate.sourceCompoundId, compoundId, 'workspace retains aggregate origin');
  const restoredState = { ...store.getState(), networkVisualization: restored };
  assert.match(selectView(restoredState, viewIds[1]).label, /^After closing source/, 'restored snapshots resolve current catalog names');
  assert.match(selectView(restoredState, 'aggregate').label, /^After closing source/);
  const legacy = structuredClone(restoredState);
  delete legacy.networkVisualization.viewsById.aggregate.sourceCompoundId;
  legacy.networkVisualization.temporaryNetworksById.temporary = { sourceViewId: viewIds[1] };
  assert.match(selectView(legacy, 'aggregate').label, /^After closing source/, 'legacy aggregates resolve their surviving source view');
  const legacyOrphan = structuredClone(legacy);
  legacyOrphan.networkVisualization.temporaryNetworksById.temporary.sourceViewId = viewIds[0];
  assert.match(selectView(legacyOrphan, 'aggregate').label, /^After closing source/, 'legacy aggregates also resolve a closed source view');
  assert.equal(selectView(store.getState(), 'missing'), undefined);
  assert.equal(networkTooltipValue(null, 'missing', 'Saved name'), 'Saved name');
  console.log('Catalog label propagation checks passed.');
} finally {
  await server.close();
}
