import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
try {
  const load = path => server.ssrLoadModule(`/src/${path}.ts`)
  const { default: reducer, setAtlasColorFields, setMatrixHierarchyFields, setCircularHierarchyFields, setAggregationFields } = await load('store/slices/atlasUi/atlasUiSlice')
  const { orderAtlasLabels } = await load('utils/orderAtlasLabels')
  const { buildNodeGroupingColorById } = await load('utils/groupingColoring')
  const { buildAggregatedAtlasNodes, buildAggregatedNodeColors } = await load('utils/aggregatedNodePresentation')
  const { buildCanonicalMatrixData } = await load('components/network/networkViewRenderData')
  const { sessionSchema } = await load('workspace/sessionSchema')
  let state = reducer(undefined, { type: 'init' })
  const atlas = { id: 'test', name: 'Test', nodes: [
    { id: 'a', hemisphere: 'R', network: 'A' }, { id: 'b', hemisphere: 'L', network: 'B' },
    { id: 'c', hemisphere: 'L', network: 'A' },
  ].map(({ id, ...metadata }, index) => ({ id, atlasId: id, label: id, name: id, index, metadata })) }
  const ids = atlas.nodes.map(node => node.id)
  state = reducer(state, setAtlasColorFields(['network']))
  state = reducer(state, setMatrixHierarchyFields(['hemisphere']))
  state = reducer(state, setCircularHierarchyFields(['network']))
  state = reducer(state, setAggregationFields(['hemisphere']))
  const colors = () => buildNodeGroupingColorById({ atlasDefinition: atlas, groupingFields: state.colorFields, colorPalette: state.colorPalette })
  const ordering = () => orderAtlasLabels(ids, atlas, state.matrixHierarchyFields, {})
  assert.deepEqual(ordering(), ['b', 'c', 'a'])
  const originalColors = colors()
  state = reducer(state, setMatrixHierarchyFields(['network']))
  assert.deepEqual(colors(), originalColors)
  const networkOrder = ordering()
  state = reducer(state, setAtlasColorFields(['hemisphere']))
  assert.deepEqual(ordering(), networkOrder)
  assert.deepEqual(state.aggregationFields, ['hemisphere'])
  assert.deepEqual(state.circularHierarchyFields, ['network'])
  assert.deepEqual(orderAtlasLabels(ids, atlas, [], {}), ids)
  const data = [[0, 1, 2], [1, 0, 3], [2, 3, 0]]
  const reordered = buildCanonicalMatrixData({ matrixData: data, labels: ids,
    rowLabelSelection: networkOrder, colLabelSelection: networkOrder, hideIsolatedNodes: false })
  reordered.rowLabels.forEach((row, i) => reordered.colLabels.forEach((col, j) => {
    assert.equal(reordered.data[i][j], data[ids.indexOf(row)][ids.indexOf(col)])
  }))
  const group = { id: 'g', label: 'Group', nodeIds: ['a', 'c'], criteria: {} }
  const { appColors } = await load('theme')
  const mixedGroup = { ...group, id: 'mixed', nodeIds: ['a', 'b'] }
  assert.deepEqual(buildAggregatedNodeColors([group, mixedGroup]), {
    g: appColors.textSecondary, mixed: appColors.textSecondary,
  })
  const [aggregate] = buildAggregatedAtlasNodes([group], atlas, ['network', 'hemisphere'])
  assert.deepEqual(aggregate.metadata, { network: 'A', hemisphere: 'Mixed' })
  const { resolveNetworkViewWithContext } = await load('components/network/views/useNetworkViewResolver')
  const context = {
    dataset: null, nodeOrderIds: ids, activeLabelIds: ids, matrixViewActiveLabelIds: ids,
    atlasOrderLength: ids.length, orderingAtlasDefinition: atlas,
    matrixHierarchyFields: ['hemisphere'], circularHierarchyFields: ['network'],
    matrixHierarchyCategoryOrder: {}, circularHierarchyCategoryOrder: {}, uiRangeMode: 'view_observed',
    temporaryNetworks: {
      first: { groups: [group, { ...group, id: 'h', nodeIds: ['b'] }] },
      second: { groups: [{ ...group, nodeIds: ['c'] }, { ...group, id: 'h', nodeIds: ['a'] }] },
    },
  }
  const resolve = id => resolveNetworkViewWithContext({
    view: { id, type: 'matrix', temporaryNetworkId: id },
    networkView: { id, nodeIds: ['g', 'h'], data: [[0, 7], [7, 0]], symmetric: true }, context,
  })
  const first = resolve('first')
  const second = resolve('second')
  assert.deepEqual(first.rowLabels, ['h', 'g'])
  assert.deepEqual(second.rowLabels, ['g', 'h'])
  assert.equal(first.orderingAtlasDefinition.nodes.find(node => node.id === 'g').metadata.hemisphere, 'Mixed')
  assert.equal(second.orderingAtlasDefinition.nodes.find(node => node.id === 'g').metadata.hemisphere, 'L')
  assert.equal(first.data[0][1], 7)
  const schema = sessionSchema.shape.atlasUi
  const incomplete = { ...state }; delete incomplete.aggregationFields
  assert.equal(schema.safeParse(incomplete).success, false)
  assert.deepEqual(schema.parse(state), state)
  const cleared = reducer(state, setMatrixHierarchyFields([]))
  assert.deepEqual(schema.parse(cleared).matrixHierarchyFields, [])
  assert.equal(schema.safeParse({ ...state, aggregationFields: [42] }).success, false)
  // Current workspace archives preserve independent color, ordering and aggregation settings.
  await load('store/slices/visualizationUi/visualizationUiSlice')
  const { combinedReducer } = await load('store/rootReducer')
  const { setDataset } = await load('store/slices/dataset/datasetSlice')
  const { loadNetworkImportFromBytes } = await load('utils/import/loadNetworkImport')
  const { snapshotWorkspace, prepareWorkspace } = await load('workspace/state')
  const { encodeWorkspace, decodeWorkspace } = await load('workspace/archive')
  const bytes = readFileSync('public/examples/complete_example.zip')
  const { dataset } = await loadNetworkImportFromBytes('example.zip', bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
  let workspace = combinedReducer(undefined, { type: 'init' })
  workspace = combinedReducer(workspace, setDataset({ content: dataset }))
  workspace = combinedReducer(workspace, setAtlasColorFields(['hemisphere']))
  workspace = combinedReducer(workspace, setMatrixHierarchyFields([]))
  workspace = combinedReducer(workspace, setCircularHierarchyFields(['network']))
  workspace = combinedReducer(workspace, setAggregationFields(['hemisphere']))
  const roundTrip = prepareWorkspace(await decodeWorkspace(await encodeWorkspace(snapshotWorkspace(workspace))))
  assert.deepEqual(roundTrip.atlasUi, workspace.atlasUi)
  const { resolveValueDomain } = await load('utils/valueDomain')
  const domain = resolveValueDomain({ network: { ...dataset.networks[0], dataStats: undefined }, catalogs: dataset.catalogs, mode: 'view_observed' })
  assert.ok(Number.isFinite(domain.min) && Number.isFinite(domain.max))
  console.log('Grouping, ordering, aggregation colors, matrix values and session round trip: OK')
} finally { await server.close() }
