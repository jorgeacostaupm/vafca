import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import { readFileSync } from 'node:fs';
import { strToU8, unzipSync, zipSync } from 'fflate';
import * as THREE from 'three';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const bytes = path => new Uint8Array(readFileSync(path));
try {
  const { loadSpatialManifest } = await server.ssrLoadModule('/src/spatial/loadSpatialManifest.ts');
  const { buildAtlasMapping } = await server.ssrLoadModule('/src/spatial/buildAtlasMapping.ts');
  const { loadSpatialAtlas, getSpatialAtlas, getSpatialFiles, releaseSpatialAtlas } = await server.ssrLoadModule('/src/spatial/loadSpatialAtlas.ts');
  const { createAtlasView } = await server.ssrLoadModule('/src/spatial/atlasView.ts');
  const { createSpatialGeometryBuilder, orientSpatialGroup, getSpatialNodeCenter } = await server.ssrLoadModule('/src/utils/atlas/spatialGeometry.ts');
  const { loadNetworkImportFromBytes } = await server.ssrLoadModule('/src/utils/import/loadNetworkImport.ts');
  const { buildAtlasSourceFromNodeSet } = await server.ssrLoadModule('/src/utils/atlas/nodeDerivedAtlas.ts');
  const { atlasSupports3d } = await server.ssrLoadModule('/src/utils/atlas/atlasDefinition.ts');
  const { encodeDatasetEntries } = await server.ssrLoadModule('/src/workspace/datasetArchive.ts');
  const { encodeWorkspace, decodeWorkspace } = await server.ssrLoadModule('/src/workspace/archive.ts');
  const files = unzipSync(bytes('public/examples/use_case_1.zip'));
  const manifest = loadSpatialManifest(files);
  assert.equal(manifest.version, 1);
  assert.equal(loadSpatialManifest({ 'spatial/unrelated.glb': new Uint8Array() }), null);
  for (const invalid of [{ ...manifest, version: 2 }, { ...manifest, atlas: { ...manifest.atlas, format: 'obj' } },
    { ...manifest, atlas: { ...manifest.atlas, file: '../escape.glb' } }, { ...manifest, atlas: { ...manifest.atlas, file: '/tmp/a.glb' } },
    { ...manifest, atlas: { ...manifest.atlas, file: 'missing.glb' } }, { ...manifest, atlas: { ...manifest.atlas, mapping: { roi_field: 'id', model_field: 'extras' } } }]) {
    assert.throws(() => loadSpatialManifest({ ...files, 'spatial/manifest.json': strToU8(JSON.stringify(invalid)) }));
  }
  assert.throws(() => loadSpatialManifest({ 'spatial/manifest.json': strToU8('{') }));
  const imported = await loadNetworkImportFromBytes('use_case_1.zip', bytes('public/examples/use_case_1.zip').buffer);
  assert.deepEqual(imported.normalized.issues.errors, []);
  const state = imported.dataset.nodeSet.spatial;
  const atlas = buildAtlasSourceFromNodeSet(imported.dataset.nodeSet, 'use_case_1.zip').atlas;
  assert.equal(atlas.nodes.length, 68);
  assert.equal(state.matchedRois, 68);
  assert.deepEqual(state.missingRois, []);
  assert.deepEqual(state.warnings, []);
  assert.ok(atlasSupports3d(atlas));
  const loaded = getSpatialAtlas(state);
  assert.equal(loaded.roiObjects.get('lh-bankssts').userData.vafcaRoiId, 'lh-bankssts');
  const parent = new THREE.Group();
  const first = createAtlasView(parent, state);
  const second = createAtlasView(new THREE.Group(), state);
  assert.equal(getSpatialAtlas(state), loaded, 'Views reuse the loaded GLB');
  assert.notEqual(first.meshes[0].material, second.meshes[0].material);
  assert.notEqual(first.meshes[0].geometry, second.meshes[0].geometry);
  const ui = await server.ssrLoadModule('/src/config/ui.ts');
  const mesh = first.meshes[0];
  assert.equal(first.roiMeshes.get(mesh.userData.vafcaRoiId), mesh);
  assert.ok(mesh.material instanceof THREE.MeshStandardMaterial);
  assert.equal(mesh.material.roughness, 1);
  assert.equal(mesh.material.metalness, 0);
  assert.equal(mesh.material.depthWrite, false);
  assert.equal(mesh.material.depthTest, true);
  assert.equal(mesh.material.side, THREE.FrontSide);
  assert.equal(mesh.material.map, null);
  assert.equal(mesh.castShadow || mesh.receiveShadow, false);
  assert.equal(mesh.material.opacity, ui.SPATIAL_ATLAS_CONTEXT_OPACITY);
  first.update('#ff0000', mesh.userData.vafcaRoiId);
  assert.equal(mesh.material.opacity, ui.SPATIAL_ATLAS_HOVER_OPACITY);
  const { appColors } = await server.ssrLoadModule('/src/theme.ts');
  first.update('#ff0000', null, undefined, new Set([mesh.userData.vafcaRoiId]));
  assert.equal(mesh.material.color.getHexString(), new THREE.Color(appColors.spatialIncident).getHexString());
  assert.equal(mesh.material.opacity, ui.SPATIAL_ATLAS_HOVER_OPACITY);
  first.update('#ff0000', mesh.userData.vafcaRoiId, undefined, new Set([mesh.userData.vafcaRoiId]));
  assert.equal(mesh.material.color.getHexString(), new THREE.Color(appColors.spatialIncident).getHexString(), 'Selected link keeps its ROI green during hover');
  const selectedId = first.meshes[0].userData.vafcaRoiId;
  first.update('#ff0000', null);
  assert.equal(first.meshes[0].material.opacity, ui.SPATIAL_ATLAS_CONTEXT_OPACITY);
  first.update('#ff0000', null, { [selectedId]: false });
  first.update('#ff0000', selectedId);
  assert.equal(first.meshes[0].visible, false, 'Hover preserves ROI visibility filters');
  first.update('#ff0000', null, {});
  assert.equal(first.meshes[0].visible, true);
  const node = atlas.nodes[0];
  const point = createSpatialGeometryBuilder(atlas.nodes, 'geometry', state)(node);
  assert.deepEqual(point.center.toArray(), [node.coords.x, node.coords.y, node.coords.z]);
  const marker = new THREE.Mesh(point.geometry);
  parent.add(marker);
  orientSpatialGroup(parent, atlas.nodes, state);
  parent.updateMatrixWorld(true);
  assert.deepEqual(marker.matrixWorld.elements, first.root.parent.matrixWorld.elements, 'Atlas, anchors and links share their parent transform');
  assert.equal(createSpatialGeometryBuilder(atlas.nodes, 'none', state)(node), null);
  assert.deepEqual(getSpatialNodeCenter({ ...node, coords: { x: 0, y: 0, z: 0 } }, state), [0, 0, 0]);
  let viewGeometryDisposals = 0;
  let viewMaterialDisposals = 0;
  first.meshes[0].geometry.addEventListener('dispose', () => viewGeometryDisposals++);
  first.meshes[0].material.addEventListener('dispose', () => viewMaterialDisposals++);
  first.dispose(); second.dispose(); point.geometry.dispose(); marker.material.dispose();
  assert.equal(viewGeometryDisposals, 1);
  assert.equal(viewMaterialDisposals, 1);

  const genericManifest = { version: 1, atlas: { type: 'surface-atlas', format: 'glb', file: 'nested/model.glb', mapping: { roi_field: 'custom_key', model_field: 'name' } } };
  const group = new THREE.Group(); group.name = 'custom-region';
  const sharedMaterial = new THREE.MeshStandardMaterial();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(), sharedMaterial), new THREE.Mesh(new THREE.BoxGeometry(), sharedMaterial));
  const root = new THREE.Group(); root.add(group);
  const mapping = buildAtlasMapping(root, genericManifest, [{ id: 'roi-42', custom_key: 'custom-region' }, { id: 'missing' }]);
  assert.equal(mapping.roiObjects.get('custom-region'), group);
  assert.ok(group.children.every(child => child.userData.vafcaRoiId === 'roi-42'));
  assert.deepEqual(mapping.unmatchedRois, ['missing']);
  assert.throws(() => buildAtlasMapping(root, genericManifest, [{ id: 'a', custom_key: 'same' }, { id: 'b', custom_key: 'same' }]), /Duplicate ROI/);

  const rois = JSON.parse(new TextDecoder().decode(files['rois.json']));
  const partialRois = rois.map((roi, i) => ({ ...roi, custom_key: i ? roi.id : 'absent', coords: i === 1 ? undefined : { ...roi.coords, space: 'different' } }));
  const partialFiles = { 'spatial/manifest.json': strToU8(JSON.stringify({ ...genericManifest, coordinate_space: 'original' })), 'spatial/nested/model.glb': files['spatial/desikan68.glb'] };
  const partial = await loadSpatialAtlas(partialFiles, partialRois, partialRois);
  assert.equal(partial.matchedRois, 67);
  assert.deepEqual(partial.missingRois, [rois[0].id]);
  assert.ok(partial.warnings.some(warning => warning.includes('coordinate-space mismatch')));
  assert.ok(partial.anchors[rois[1].id]);
  assert.ok(partial.warnings.some(warning => warning.includes('visual fallback')));
  assert.equal(getSpatialNodeCenter({ id: 'no-geometry', coords: null }, partial), null);
  releaseSpatialAtlas(partial.resourceId);
  await assert.rejects(() => loadSpatialAtlas({ ...files, 'spatial/desikan68.glb': strToU8('broken') }, rois, rois));

  const plainFiles = { ...files }; delete plainFiles['spatial/manifest.json'];
  const plain = await loadNetworkImportFromBytes('points.zip', zipSync(plainFiles).buffer);
  assert.equal(plain.dataset.nodeSet.spatial, undefined);
  assert.ok(atlasSupports3d(buildAtlasSourceFromNodeSet(plain.dataset.nodeSet, 'points.zip').atlas));
  const exported = encodeDatasetEntries(imported.dataset).entries;
  assert.ok(exported['spatial/manifest.json']); assert.ok(exported['spatial/desikan68.glb']);
  assert.equal(exported['rois-geometries.json'], undefined);
  const archive = await encodeWorkspace({ dataset: imported.dataset, atlas, session: {} });
  const restored = await decodeWorkspace(archive);
  assert.equal(restored.dataset.nodeSet.spatial.matchedRois, 68);
  assert.equal(restored.atlas.spatial.resourceId, restored.dataset.nodeSet.spatial.resourceId);
  releaseSpatialAtlas(restored.dataset.nodeSet.spatial.resourceId);
  const { rootReducer } = await server.ssrLoadModule('/src/store/rootReducer.ts');
  const { spatialLifecycle } = await server.ssrLoadModule('/src/spatial/lifecycle.ts');
  const { toggleNetworkZoomLabelSelection, resetNetworkZoomLabelSelection } = await server.ssrLoadModule('/src/store/slices/networkVisualization/index.ts');
  const { setDataset, clearDataset } = await server.ssrLoadModule('/src/store/slices/dataset/datasetSlice.ts');
  const { snapshotWorkspace, prepareWorkspace } = await server.ssrLoadModule('/src/workspace/state.ts');
  const store = configureStore({ reducer: rootReducer, middleware: getDefault => getDefault({ serializableCheck: false, immutableCheck: false }).prepend(spatialLifecycle) });
  store.dispatch(setDataset({ content: imported.dataset }));
  const { useSpatialSelection } = await server.ssrLoadModule('/src/spatial/useSpatialSelection.ts');
  const selectionState = store.getState();
  const selectionStore = configureStore({ reducer: () => ({ ...selectionState,
    networkVisualization: { ...selectionState.networkVisualization, selectedNodeIds: ['explicit'] },
    visualizationUi: { ...selectionState.visualizationUi, selectedLinks: [{ rowId: 'a', colId: 'b' }] },
  }) });
  let spatialSelection;
  function SelectionProbe() { spatialSelection = useSpatialSelection(); return null; }
  renderToStaticMarkup(createElement(Provider, { store: selectionStore }, createElement(SelectionProbe)));
  assert.deepEqual([...spatialSelection.selected], ['explicit'], 'Link endpoints do not select point markers');
  assert.deepEqual([...spatialSelection.incident], ['a', 'b'], 'Selected links independently highlight their anatomical ROIs');
  store.dispatch(toggleNetworkZoomLabelSelection({ label: rois[0].id }));
  assert.deepEqual(store.getState().networkVisualization.viewsOrder, []);
  assert.deepEqual(store.getState().networkVisualization.selectedNodeIds, [rois[0].id], 'ROI selection works without network views');
  store.dispatch(toggleNetworkZoomLabelSelection({ viewId: 'matrix', label: rois[1].id }));
  assert.deepEqual(store.getState().networkVisualization.selectedNodeIds, [rois[0].id, rois[1].id], '2D and 3D use one node selection');
  assert.equal(getSpatialAtlas(state), loaded, 'Selection does not reload the atlas');
  const { resolveComputedNetworkView } = await server.ssrLoadModule('/src/components/network/views/networkViewModel.ts');
  const network = imported.dataset.networks[0];
  for (const type of ['matrix', 'circular', 'classic']) {
    const computed = resolveComputedNetworkView({
      view: { id: type, type, compoundId: network.id },
      networkView: { ...network, compoundId: network.id, data: network.data.values, symmetric: true },
      settings: {}, nodeOrderIds: network.nodeIds, atlasOrderLength: network.nodeIds.length,
      activeLabelIds: network.nodeIds, matrixViewActiveLabelIds: network.nodeIds,
      circularHierarchyCategoryOrder: {}, matrixHierarchyCategoryOrder: {},
      dataset: { content: imported.dataset }, uiRangeMode: 'observed',
      selectedNodeIds: store.getState().networkVisualization.selectedNodeIds,
    });
    assert.deepEqual(computed.zoomLabelSelection, [rois[0].id, rois[1].id], `${type} reflects shared ROI selection`);
  }

  const snapshot = snapshotWorkspace(store.getState());
  const prepared = prepareWorkspace(snapshot);
  assert.deepEqual(prepared.networkVisualization.selectedNodeIds, [rois[0].id, rois[1].id], 'Workspace preserves global node selection');
  store.dispatch(resetNetworkZoomLabelSelection());
  assert.deepEqual(store.getState().networkVisualization.selectedNodeIds, []);
  let disposed = false;
  loaded.root.traverse(object => {
    if (object instanceof THREE.Mesh) object.geometry.addEventListener('dispose', () => { disposed = true; });
  });
  store.dispatch(clearDataset());
  assert.ok(disposed, "Dataset replacement disposes its cached model");
  assert.equal(viewGeometryDisposals, 1, "Dataset disposal does not dispose view geometry twice");
  assert.equal(loaded.roiObjects.size, 0);
  assert.equal(getSpatialAtlas(state), null);
  assert.throws(() => getSpatialFiles(state), /no longer available/);
  const { initializeDatasetAndDerivedState } = await server.ssrLoadModule('/src/store/slices/dataset/thunks/initializeDatasetAndDerivedState.ts');
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; return new Response(bytes('public/examples/use_case_1.zip')); };
  try {
    const initializing = configureStore({ reducer: rootReducer, middleware: getDefault => getDefault({ serializableCheck: false, immutableCheck: false }).prepend(spatialLifecycle) });
    const config = { loadInitialDataset: true, initialDatasetFile: { path: 'example.zip', label: 'Example' } };
    await Promise.all([initializing.dispatch(initializeDatasetAndDerivedState(config)), initializing.dispatch(initializeDatasetAndDerivedState(config))]);
    assert.equal(requests, 1, 'StrictMode duplicate initialization loads the dataset and atlas only once');
    assert.equal(initializing.getState().dataset.nodeSet.spatial.matchedRois, 68);
    initializing.dispatch(clearDataset());
  } finally { globalThis.fetch = originalFetch; }
  console.log('Spatial atlas checks passed: 68/68 GLB mapping, generic groups, manifest errors, anchors, materials, shared transform, ZIP/workspace roundtrip and disposal.');
} finally { await server.close(); }
