import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const metadata = { hemisphere: 'left', details: { volume: 12 }, scores: [1, 2] };
  const { parseMetadataValue } = await server.ssrLoadModule('/src/utils/atlas/nodeMetadata.ts');
  assert.equal(parseMetadataValue('001', 'text'), '001');
  assert.equal(parseMetadataValue('42', 1), 42);
  assert.equal(parseMetadataValue('false', true), false);
  assert.deepEqual(parseMetadataValue('[1,2]', []), [1, 2]);
  assert.throws(() => parseMetadataValue('"42"', 1));
  assert.throws(() => parseMetadataValue('{broken}', {}));
  assert.throws(() => parseMetadataValue('{"score":1e999}', {}));
  const { updateRoiMetadata } = await server.ssrLoadModule('/src/store/actions/updateRoiMetadata.ts');
  const { default: datasetReducer } = await server.ssrLoadModule('/src/store/slices/dataset/datasetSlice.ts');
  const { default: atlasReducer } = await server.ssrLoadModule('/src/store/slices/atlasDefinition/atlasDefinitionSlice.ts');
  const { default: uiReducer } = await server.ssrLoadModule('/src/store/slices/atlasUi/atlasUiSlice.ts');
  const action = updateRoiMetadata({ id: 'a', atlasId: 'atlas', nodeSetId: 'atlas', metadata });
  const datasetState = { ...datasetReducer(undefined, { type: 'init' }), nodeSet: { id: 'atlas', nodes: [{ id: 'a', metadata: {} }, { id: 'b', metadata: {} }] } };
  const atlasState = { ...atlasReducer(undefined, { type: 'init' }), uploaded: { atlas: { id: 'atlas', nodes: [{ id: 'a', metadata: {} }] } } };
  const uiState = { ...uiReducer(undefined, { type: 'init' }), labelsById: { a: { id: 'a', metadata: {}, enabled: false } } };
  assert.deepEqual(datasetReducer(datasetState, action).nodeSet.nodes[0].metadata, metadata);
  assert.deepEqual(datasetReducer(datasetState, action).nodeSet.nodes[1].metadata, {});
  assert.deepEqual(atlasReducer(atlasState, action).uploaded.atlas.nodes[0].metadata, metadata);
  assert.deepEqual(uiReducer(uiState, action).labelsById.a.metadata, metadata);
  assert.equal(uiReducer(uiState, action).labelsById.a.enabled, false);
  assert.equal(datasetReducer(datasetState, updateRoiMetadata({ ...action.payload, nodeSetId: 'other' })), datasetState);
  console.log('ROI metadata editing checks passed.');
} finally {
  await server.close();
}
