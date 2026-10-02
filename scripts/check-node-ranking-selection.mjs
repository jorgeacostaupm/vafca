import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
try {
  const { getNodeRankingChanges } = await server.ssrLoadModule('/src/components/rankings/useNodeRankingSelection.tsx')
  const actions = await server.ssrLoadModule('/src/store/slices/visualizationUi/visualizationUiSlice.ts')
  const { combinedReducer } = await server.ssrLoadModule('/src/store/rootReducer.ts')
  const selectors = await server.ssrLoadModule('/src/store/slices/visualizationUi/annotationSelectors.ts')
  const rows = [{ type: 'node', nodeId: 'a', label: 'A' }, { type: 'node', nodeId: 'a', label: 'A duplicate' }, { type: 'node', nodeId: 'b', label: 'B' }, { type: 'network' }]
  assert.deepEqual(getNodeRankingChanges(rows, new Set(['a']), true).map(row => row.nodeId), ['b'])
  assert.deepEqual(getNodeRankingChanges(rows, new Set(['a']), false).map(row => row.nodeId), ['a'])
  let state = combinedReducer(undefined, { type: '@@init' })
  const dispatch = action => { state = combinedReducer(state, action) }
  for (const row of getNodeRankingChanges(rows, new Set(), true)) {
    dispatch(actions.toggleAnnotationNode({ id: row.nodeId, label: row.label }))
  }
  assert.deepEqual(selectors.selectCurrentAnnotation(state).nodes, [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }])
  assert.ok(selectors.selectAnnotationNodeColors(state).a)
  dispatch(actions.setAtlasNodeIds(['a']))
  dispatch(actions.toggleAnnotationNode({ id: 'a', label: 'A' }))
  assert.deepEqual(selectors.selectCurrentAnnotation(state).atlasNodeIds, [])
  assert.equal(selectors.selectAnnotationNodeColors(state).a, undefined)
  console.log('Node ranking selection checks passed')
} finally {
  await server.close()
}
