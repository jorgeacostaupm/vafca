import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { default: reducer, addNetworkView, addTemporaryAggregatedNetworkView, applyNetworkZoom, stepNetworkZoomHistory, patchNetworkControls } =
    await server.ssrLoadModule('/src/store/slices/networkVisualization/networkVisualizationSlice.ts');
  const settings = (state, id) => state.viewsById[id].type === 'matrix'
    ? state.matrixSettingsByViewId[id] : state.nodeLinkSettingsByViewId[id];
  const selection = { rows: ['a'], cols: ['b'], linkIds: ['a::b'] };
  for (const sourceType of ['matrix', 'circular', 'classic']) {
    for (const targetType of ['matrix', 'circular', 'classic']) {
      for (const syncZoom of [true, false]) {
        let state = reducer(undefined, patchNetworkControls({ syncZoom }));
        const add = type => {
          state = reducer(state, addNetworkView({ type, compoundId: 'network', label: 'Network', measureId: 'fc', statisticId: 'value' }));
          return state.viewsOrder[0];
        };
        const sourceId = add(sourceType);
        assert.equal(settings(state, sourceId).zoomHistory, undefined);
        state = reducer(state, applyNetworkZoom({ targetViewIds: [sourceId], selection }));
        state = reducer(state, applyNetworkZoom({ targetViewIds: [sourceId], selection: null }));
        state = reducer(state, stepNetworkZoomHistory({ targetViewIds: [sourceId], delta: -1 }));
        state = reducer(state, addTemporaryAggregatedNetworkView({ viewId: 'temporary', temporaryNetworkId: 'aggregate', type: targetType }));
        state = reducer(state, applyNetworkZoom({ targetViewIds: ['temporary'], selection: { rows: ['group'], cols: ['group'] } }));
        const targetId = add(targetType);
        const inherits = syncZoom && (sourceType === 'matrix') === (targetType === 'matrix');
        const context = `${sourceType} -> ${targetType}, sync=${syncZoom}`;
        if (inherits) {
          assert.deepEqual(settings(state, targetId).zoomHistory, [null, selection, null], context);
          assert.equal(settings(state, targetId).zoomIndex, 1, context);
          for (const delta of [-1, 1, 1]) {
            state = reducer(state, stepNetworkZoomHistory({ targetViewIds: [sourceId, targetId], delta }));
            assert.equal(settings(state, targetId).zoomIndex, settings(state, sourceId).zoomIndex, context);
          }
          state = reducer(state, applyNetworkZoom({ targetViewIds: [targetId], selection }));
          assert.deepEqual(settings(state, sourceId).zoomHistory, [null, selection, null], context);
        } else {
          assert.equal(settings(state, targetId).zoomHistory, undefined, context);
          assert.equal(settings(state, targetId).zoomIndex, undefined, context);
        }
      }
    }
  }
  console.log('Coordinated zoom checks passed.');
} finally {
  await server.close();
}
