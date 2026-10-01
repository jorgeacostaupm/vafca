// Run with: node scripts/check-aggregation-modal.mjs
import assert from 'node:assert/strict'
import { createServer } from 'vite'

globalThis.window = { setTimeout }
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
try {
  const { aggregateNetworkView } = await server.ssrLoadModule('/src/store/slices/networkVisualization/thunks/aggregateNetworkView.ts')
  const { default: atlasReducer } = await server.ssrLoadModule('/src/store/slices/atlasUi/atlasUiSlice.ts')
  const state = {
    dataset: { id: 'test', label: 'Test', catalogs: {}, nodeSet: { id: 'nodes', nodes: [
      { id: 'a', metadata: { region: 'A', hemisphere: 'L' } },
      { id: 'b', metadata: { region: 'A', hemisphere: 'R' } },
      { id: 'c', metadata: { region: 'B', hemisphere: 'L' } },
    ] }, networks: { ids: ['source'], entities: { source: { id: 'source' } } } },
    atlasUi: { ...atlasReducer(undefined, { type: 'init' }), aggregationFields: ['hemisphere'] },
    networkVisualization: { viewsById: { view: { id: 'view', label: 'Source', type: 'matrix' } }, nextViewSeq: 1 },
  }
  const request = { sourceViewId: 'view', sourceNetworkId: 'source', sourceViewType: 'matrix', fields: ['region'],
    snapshot: { data: [[0, 2, 4], [2, 0, 8], [4, 8, 0]], rowLabels: ['a', 'b', 'c'], colLabels: ['a', 'b', 'c'], symmetric: true } }
  const actions = []
  const run = args => aggregateNetworkView(args)(action => { actions.push(action); return action }, () => state, undefined)
  const result = await run(request)
  assert.equal(result.meta.requestStatus, 'fulfilled', JSON.stringify(result))
  const network = actions.find(action => action.type.endsWith('/setTemporaryAggregatedNetwork')).payload.network
  assert.deepEqual(network.groups.map(group => group.nodeIds), [['a', 'b'], ['c']])
  assert.equal(network.data[0][1], 6)
  assert.deepEqual(state.atlasUi.aggregationFields, ['hemisphere'])
  assert.equal(network.labelNames['region=A'], 'G1')
  const { appColors } = await server.ssrLoadModule('/src/theme.ts')
  assert.deepEqual(network.nodeColors, { 'region=A': appColors.textSecondary, 'region=B': appColors.textSecondary })
  state.atlasUi = { ...state.atlasUi, colorFields: ['region'] }

  const longLabel = 'Frontal izquierdo / Red por defecto / Región anterior'
  actions.length = 0
  assert.equal((await run({ ...request, groupLabels: { 'region=A': `  ${longLabel}  `, 'region=B': '  ' } })).meta.requestStatus, 'fulfilled')
  const named = actions.find(action => action.type.endsWith('/setTemporaryAggregatedNetwork')).payload.network
  assert.equal(named.labelNames['region=A'], longLabel)
  assert.equal(named.labelAcronyms['region=A'], longLabel)
  assert.equal(named.labelNames['region=B'], 'G2')
  assert.equal(named.labelTitles['region=A'], `${longLabel} — region: A`)
  assert.deepEqual(named.data, network.data)
  assert.deepEqual(named.nodeColors, network.nodeColors)
  const { shortenAggregatedNodeLabels } = await server.ssrLoadModule('/src/utils/aggregatedNodePresentation.ts')
  const { AGGREGATED_NODE_LABEL_MAX_CHARACTERS: limit } = await server.ssrLoadModule('/src/config/ui.ts')
  const displayed = shortenAggregatedNodeLabels(named.labelNames)
  assert.equal(displayed['region=A'], longLabel.slice(0, limit - 1) + '…')
  assert.equal(displayed['region=B'], 'G2')
  assert.equal(named.labelNames['region=A'], longLabel)
  assert.equal(shortenAggregatedNodeLabels({ a: '🧠'.repeat(limit + 1) }).a, '🧠'.repeat(limit - 1) + '…')
  actions.length = 0
  assert.equal((await run({ ...request, groupLabels: { 'region=A': 12 } })).meta.requestStatus, 'rejected')
  assert.ok(!actions.some(action => action.type.endsWith('/addTemporaryAggregatedNetworkView')))

  for (const fields of [[], ['nonexistent']]) {
    actions.length = 0
    assert.equal((await run({ ...request, fields })).meta.requestStatus, 'rejected')
    assert.ok(!actions.some(action => action.type.endsWith('/addTemporaryAggregatedNetworkView')))
  }
  actions.length = 0
  assert.equal((await run({ ...request, snapshot: { data: [[0, 2], [2, 0]], rowLabels: ['a', 'b'], colLabels: ['a', 'b'], symmetric: true } })).meta.requestStatus, 'rejected')
  const { default: viewReducer, renameAggregatedGroups } = await server.ssrLoadModule('/src/store/slices/networkVisualization/networkVisualizationSlice.ts')
  const initial = viewReducer(undefined, { type: 'init' })
  const beforeRename = { ...initial,
    viewsById: { generated: { id: 'generated', temporaryNetworkId: named.id, status: 'ready' } },
    viewsOrder: ['generated'], temporaryNetworksById: { [named.id]: named },
  }
  const afterRename = viewReducer(beforeRename, renameAggregatedGroups({ viewId: 'generated',
    labels: { 'region=A': '  New name  ', 'region=B': '' },
  }))
  const renamed = afterRename.temporaryNetworksById[named.id]
  assert.equal(renamed.labelNames['region=A'], 'New name')
  assert.equal(renamed.labelAcronyms['region=A'], 'New name')
  assert.equal(renamed.labelTitles['region=A'], 'New name — region: A')
  assert.equal(renamed.labelNames['region=B'], 'G2')
  assert.equal(named.labelNames['region=A'], longLabel)
  assert.equal(renamed.data, named.data)
  assert.equal(renamed.groups, named.groups)
  assert.equal(afterRename.viewsById, beforeRename.viewsById)
  assert.equal(afterRename.matrixSettingsByViewId, beforeRename.matrixSettingsByViewId)
  assert.equal(viewReducer(afterRename, renameAggregatedGroups({ viewId: 'missing', labels: {} })), afterRename)
  assert.equal(viewReducer(afterRename, renameAggregatedGroups({ viewId: 'generated', labels: { 'region=A': 42 } })), afterRename)
  console.log('Aggregation creation and editing checks passed')
} finally {
  await server.close()
  delete globalThis.window
}
