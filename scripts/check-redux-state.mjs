import { configureStore } from '@reduxjs/toolkit';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const load = path => server.ssrLoadModule(`/src/${path}.ts`);
  const { rootReducer } = await load('store/rootReducer');
  const { setDataset, updateCatalogItem } = await load('store/slices/dataset/datasetSlice');
  const { computeDerivedNetworks } = await load('store/slices/dataset/thunks/computeDerivedNetworks');
  const { computeAggregatedNetworkFromVisualizationGroups: aggregate } = await load('store/slices/dataset/thunks/computeAggregatedNetworks');
  const { recomputeAggregatedNetworksForActiveNodes: recomputeAggregated } = await load('store/slices/dataset/thunks/recomputeAggregatedNetworksForActiveNodes');
  const { selectMaterializedNetworkByCompoundId } = await load('store/slices/dataset/datasetSelectors');
  const { selectAtlasPresentation, selectDatasetNodeOrderIds } = await load('store/slices/atlasUi/atlasPresentationSelectors');
  const { setAtlasLabels, setLabelEnabled, setAggregationFields } = await load('store/slices/atlasUi/atlasUiSlice');
  const { selectAtlasEnabledIds } = await load('store/slices/atlasUi/atlasUiSelectors');
  const { addNetworkView } = await load('store/slices/networkVisualization/networkVisualizationSlice');
  const { addNetworkLayoutItem } = await load('store/slices/networkLayout/networkLayoutSlice');
  const { addSelectedLink } = await load('store/slices/visualizationUi/visualizationUiSlice');
  const { updateCatalogItemAndPruneActiveNetworks } = await load('store/workflows/updateCatalogItemAndPruneActiveNetworks');
  const { patchRankingQuery } = await load('store/slices/rankings/rankingsSlice');
  const { runRankingQuery } = await load('store/slices/rankings/thunks/runRankingQuery');
  const { recomputeRankingsForActiveFilters: refresh } = await load('store/slices/rankings/thunks/recomputeRankingsForActiveFilters');
  const { rankingFilterListenerMiddleware } = await load('store/rankingFilterListeners');
  const { RANKING_RECOMPUTE_DEBOUNCE_MS } = await load('config/ui');
  const { createNetworkCompoundId } = await load('utils/networkMetadata');
  const network = {
    id: 'network', sourceId: 's', measureId: 'm', statisticId: 'mean', dimensions: {}, nodeIds: ['a', 'b'],
    data: { format: 'matrix', layout: 'full', values: [[0, 0.5], [0.5, 0]], missingValue: null },
  };
  const dataset = {
    id: 'dataset', label: 'Dataset', description: null, createdAt: null,
    nodeSet: { id: 'atlas', label: 'Atlas', nodes: ['a', 'b'].map((id, index) => ({ id, index, label: id, metadata: { region: id } })) },
    catalogs: { sources: { s: { id: 's', kind: 'population', enabled: true } }, measures: { m: { id: 'm', enabled: true } },
      statistics: { mean: { id: 'mean', enabled: true } }, aspects: [], aspectCatalogs: {} },
    networks: [network], networkIndex: { network },
  };
  const store = configureStore({ reducer: rootReducer });
  const initialize = () => {
    store.dispatch(setDataset({ content: structuredClone(dataset) }));
    store.dispatch(setAtlasLabels({ order: ['a', 'b'], labelsById: Object.fromEntries(
      ['a', 'b'].map(id => [id, { id, label: id, enabled: true }]),
    ) }));
  };
  initialize();
  const compoundId = createNetworkCompoundId(network);
  const matrix = selectMaterializedNetworkByCompoundId(store.getState(), compoundId);
  const nodeIds = selectDatasetNodeOrderIds(store.getState());
  const presentation = selectAtlasPresentation(store.getState());
  assert.equal(selectAtlasPresentation(store.getState()), presentation, 'presentation is shared between consumers');
  store.dispatch(updateCatalogItem({ catalog: 'sources', id: 's', changes: { label: 'Renamed' } }));
  assert.equal(selectMaterializedNetworkByCompoundId(store.getState(), compoundId), matrix, 'catalog edits do not materialize matrices again');
  assert.equal(selectDatasetNodeOrderIds(store.getState()), nodeIds);
  assert.equal(selectAtlasPresentation(store.getState()), presentation, 'catalog edits do not rebuild atlas presentation');
  const generated = { ...network, id: 'other', dimensions: { band: 'alpha' } };
  const result = { networks: [generated], warnings: [], skipped: [], existing: [] };
  const revision = store.getState().dataset.revision;
  store.dispatch(computeDerivedNetworks.fulfilled(result, 'new', [], { datasetRevision: revision }));
  assert.equal(selectMaterializedNetworkByCompoundId(store.getState(), compoundId), matrix, 'unrelated networks preserve materialized references');
  assert.equal(selectAtlasPresentation(store.getState()), presentation, 'unrelated non-aggregated networks preserve presentation');
  initialize(); // Reload the SAME dataset ID: its revision must still change.
  for (const thunk of [computeDerivedNetworks, aggregate]) {
    const before = store.getState().dataset.networks.ids.length;
    const payload = thunk === aggregate ? { ...result, existing: [] } : result;
    store.dispatch(thunk.fulfilled(payload, 'stale', [], { datasetRevision: revision }));
    assert.equal(store.getState().dataset.networks.ids.length, before, 'old calculation results must be ignored');
  }
  const pending = store.dispatch(computeDerivedNetworks({ operations: [] }));
  initialize();
  const rejected = await pending;
  assert.equal(rejected.meta.requestStatus, 'rejected');
  assert.match(rejected.error.message, /dataset changed/);
  const aborted = store.dispatch(computeDerivedNetworks({ operations: [] }));
  aborted.abort();
  assert.equal((await aborted).meta.aborted, true);
  assert.equal(store.getState().datasetOperations.derivedCalculationStatus, 'idle', 'cancellation is not an error');
  const meta = { datasetRevision: store.getState().dataset.revision };
  store.dispatch(computeDerivedNetworks.pending('first', []));
  store.dispatch(aggregate.pending('second', { baseNetworkIds: [], orderMode: 'matrix' }));
  store.dispatch(computeDerivedNetworks.fulfilled({ ...result, networks: [] }, 'first', [], meta));
  assert.equal(store.getState().datasetOperations.derivedCalculationStatus, 'loading', 'loading lasts until every calculation settles');
  store.dispatch(aggregate.fulfilled({ networks: [], existing: [], warnings: [] }, 'second', {}, meta));
  assert.equal(store.getState().datasetOperations.derivedCalculationStatus, 'ready');
  store.dispatch(computeDerivedNetworks.pending('discarded', []));
  initialize();
  store.dispatch(computeDerivedNetworks.rejected(new Error('Old failure'), 'discarded', []));
  assert.equal(store.getState().datasetOperations.derivedCalculationError, null, 'old failures cannot pollute a replacement dataset');

  store.dispatch(setAggregationFields(['region']));
  const aggregateRequest = { baseNetworkIds: [network.id], orderMode: 'matrix' };
  const staleAggregate = store.dispatch(aggregate(aggregateRequest));
  initialize();
  assert.match((await staleAggregate).error.message, /dataset changed/);
  const aggregated = await store.dispatch(aggregate(aggregateRequest)).unwrap();
  assert.equal(aggregated.networks.length, 1);
  const staleRecompute = store.dispatch(recomputeAggregated());
  initialize();
  assert.match((await staleRecompute).error.message, /dataset changed/);

  const query = { target: 'links', mode: 'networkCollection', sourceIds: ['s'], measureId: 'm', statisticId: 'mean', metric: 'highestValue', topN: 10 };
  store.dispatch(patchRankingQuery(query));
  const rankingTask = store.dispatch(runRankingQuery());
  assert.equal((await store.dispatch(runRankingQuery())).meta.condition, true, 'duplicate ranking submissions are blocked');
  const ranking = await rankingTask.unwrap();
  assert.equal(ranking.rows.length, 1);
  store.dispatch(addNetworkView({ type: 'matrix', compoundId, label: 'View', measureId: 'm', statisticId: 'mean' }));
  const viewId = store.getState().networkVisualization.viewsOrder[0];
  store.dispatch(addNetworkLayoutItem({ viewId }));
  store.dispatch(addSelectedLink({ id: 'a::b', rowId: 'a', colId: 'b', sources: [{ compoundId }] }));
  let observedDisabled = false;
  const unsubscribe = store.subscribe(() => {
    const state = store.getState();
    if (state.dataset.catalogs.sources.s.enabled) return;
    observedDisabled = true;
    assert.equal(state.networkVisualization.viewsById[viewId], undefined);
    assert.equal(state.networkLayout.layout.some(entry => entry.i === viewId), false);
    assert.equal(state.rankings.currentQuery.sourceIds, undefined);
    assert.equal(state.visualizationUi.annotations.flatMap(item => item.selectedLinks).length, 0);
  });
  await store.dispatch(updateCatalogItemAndPruneActiveNetworks({ catalog: 'sources', id: 's', changes: { enabled: false } })).unwrap();
  unsubscribe();
  assert.equal(observedDisabled, true, 'all slices change atomically');

  initialize();
  const enabled = selectAtlasEnabledIds(store.getState());
  store.dispatch(setLabelEnabled({ id: 'a', enabled: true }));
  assert.equal(selectAtlasEnabledIds(store.getState()), enabled, 'no-op visibility keeps its reference');
  store.dispatch(refresh.pending('old'));
  store.dispatch(refresh.pending('latest'));
  const original = store.getState().rankings.resultsById[ranking.id];
  store.dispatch(refresh.fulfilled([{ ...ranking, rows: [] }], 'old'));
  assert.equal(store.getState().rankings.resultsById[ranking.id], original, 'older refreshes cannot overwrite results');

  const actions = [];
  let onRefreshPending = () => {};
  const observedStore = configureStore({
    reducer: rootReducer, preloadedState: store.getState(),
    middleware: defaults => defaults().prepend(rankingFilterListenerMiddleware.middleware).concat(() => next => action => {
      actions.push(action);
      const result = next(action);
      if (refresh.pending.match(action)) onRefreshPending();
      return result;
    }),
  });
  observedStore.dispatch(setLabelEnabled({ id: 'a', enabled: false }));
  observedStore.dispatch(setLabelEnabled({ id: 'a', enabled: true }));
  observedStore.dispatch(setLabelEnabled({ id: 'b', enabled: false }));
  await delay(RANKING_RECOMPUTE_DEBOUNCE_MS + 100);
  assert.equal(actions.filter(refresh.pending.match).length, 1, 'rapid filter changes produce one refresh');
  assert.equal(observedStore.getState().rankings.resultsById[ranking.id].rows.length, 0);
  actions.length = 0;
  observedStore.dispatch(setLabelEnabled({ id: 'b', enabled: false }));
  await delay(RANKING_RECOMPUTE_DEBOUNCE_MS + 100);
  assert.equal(actions.filter(refresh.pending.match).length, 0, 'no-op filters do not refresh rankings');
  actions.length = 0;
  onRefreshPending = () => {
    onRefreshPending = () => {};
    queueMicrotask(() => observedStore.dispatch(setLabelEnabled({ id: 'a', enabled: false })));
  };
  observedStore.dispatch(setLabelEnabled({ id: 'b', enabled: true }));
  await delay(RANKING_RECOMPUTE_DEBOUNCE_MS * 2 + 100);
  assert.equal(actions.filter(refresh.pending.match).length, 2);
  assert.equal(actions.filter(action => refresh.rejected.match(action) && action.meta.aborted).length, 1,
    'a filter change cancels the running refresh');
  assert.equal(actions.filter(refresh.fulfilled.match).length, 1, 'only the latest refresh finishes');
  rankingFilterListenerMiddleware.clearListeners();
  console.log('Redux checks passed: stale results, cancellation, shared selectors, atomic catalog updates and ranking debounce.');
} finally {
  await server.close();
}
