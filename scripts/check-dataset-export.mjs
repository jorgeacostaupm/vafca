import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { configureStore } from '@reduxjs/toolkit';
import { unzipSync } from 'fflate';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const originalDocument = globalThis.document;
const originalCreateObjectURL = URL.createObjectURL;
try {
  const { loadNetworkImportFromBytes } = await server.ssrLoadModule('/src/utils/import/loadNetworkImport.ts');
  const { downloadCurrentDataset } = await server.ssrLoadModule('/src/store/slices/dataset/thunks/exportDataset.ts');
  const { initialDatasetState } = await server.ssrLoadModule('/src/store/slices/dataset/datasetTypes.ts');
  const bytes = new Uint8Array(readFileSync('public/examples/complete_example.zip'));
  const { dataset } = await loadNetworkImportFromBytes('example.zip', bytes.buffer);
  const stateFor = data => ({ dataset: {
    ...initialDatasetState, ...data,
    networks: { ids: data.networks.map(n => n.id), entities: Object.fromEntries(data.networks.map(n => [n.id, n])) },
  } });
  const storeFor = state => configureStore({ reducer: () => state });
  let blob;
  let clicked = false;
  const link = { click() { clicked = true; } };
  globalThis.document = { createElement: () => link };
  URL.createObjectURL = value => { blob = value; return originalCreateObjectURL(value); };

  const result = await storeFor(stateFor(dataset)).dispatch(downloadCurrentDataset()).unwrap();
  assert.ok(clicked);
  assert.match(result.fileName, /^vafca-dataset-.*\.zip$/);
  assert.equal(link.download, result.fileName);
  assert.equal(blob.type, 'application/zip');
  const archive = await blob.arrayBuffer();
  assert.equal('session.json' in unzipSync(new Uint8Array(archive)), false);
  const imported = await loadNetworkImportFromBytes(result.fileName, archive);
  assert.deepEqual(imported.normalized.issues.errors, []);
  assert.deepEqual(imported.dataset.catalogs, dataset.catalogs);
  assert.deepEqual(imported.dataset.networks.map(n => [n.id, n.data]), dataset.networks.map(n => [n.id, n.data]));

  const incompatible = { ...dataset, networks: [{ ...dataset.networks[0], nodeIds: ['other-roi'] }] };
  const rejected = await storeFor(stateFor(incompatible)).dispatch(downloadCurrentDataset());
  assert.ok(downloadCurrentDataset.rejected.match(rejected));
  assert.match(rejected.payload, /Export the workspace/);
  const empty = await storeFor({ dataset: initialDatasetState }).dispatch(downloadCurrentDataset());
  assert.ok(downloadCurrentDataset.rejected.match(empty));
  console.log('Dataset export checks passed: ZIP download, reimport, incompatible ROIs and empty data.');
} finally {
  globalThis.document = originalDocument;
  URL.createObjectURL = originalCreateObjectURL;
  await server.close();
}
