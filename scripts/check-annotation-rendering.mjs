// Run with Node and a locally installed Chromium (override CHROMIUM_BIN if needed).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as THREE from 'three';
import { createServer } from 'vite';

const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Provider } from 'react-redux';
import { store } from '/src/store/store.ts';
import * as actions from '/src/store/slices/visualizationUi/visualizationUiSlice.ts';
import Matrix from '/src/components/matrix/MatrixHeatmapPanel.tsx';
import NodeLink from '/src/components/nodelink/NodeLinkPanel.tsx';
import Circular from '/src/components/circular/CircularNodeLinkPanel.tsx';
import * as THREE from 'three';
import { useLinksAtlasScene } from '/src/components/selected-links/useLinksAtlasScene.ts';
import SelectedLinksAtlas from '/src/components/selected-links/SelectedLinksAtlas.tsx';
import { setUploadedAtlas } from '/src/store/slices/atlasDefinition/atlasDefinitionSlice.ts';
import { loadNetworkImportFromBytes } from '/src/utils/import/loadNetworkImport.ts';
import { buildAtlasSourceFromNodeSet } from '/src/utils/atlas/nodeDerivedAtlas.ts';
import { SPATIAL_SCENE, SPATIAL_ATLAS_CONTEXT_OPACITY, SPATIAL_ATLAS_HOVER_OPACITY } from '/src/config/ui.ts';
const labels = Array.from({length: 24}, (_, i) => 'n' + i);
const data = labels.map((_, i) => labels.map((_, j) => i === j ? NaN : (i + j + 1) / 48));
const props = { data, labels, compoundId: 'test', networkLabel: 'Test', symmetric: true };
createRoot(document.getElementById('root')).render(React.createElement(Provider, {store},
  [Matrix, NodeLink, Circular].map((View, i) => React.createElement('div', {key: i, id: 'view' + i, style: {width: 600, height: 400}}, React.createElement(View, props)))));
const settle = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const check = (value, message) => { if (!value) throw Error(message); };
window.checkRendering = async () => {
  await settle();
  const roots = [...document.querySelectorAll('svg')].map(svg => svg.firstElementChild);
  check(roots.length === 3 && roots.every(Boolean), 'All three views must render');
  const assertReused = () => [...document.querySelectorAll('svg')].forEach((svg, i) => check(svg.firstElementChild === roots[i], 'Scene rebuilt: ' + i));
  const link = { id: 'n0::n1', rowId: 'n0', colId: 'n1', rowLabel: 'n0', colLabel: 'n1', sources: [{compoundId: 'test', networkLabel: 'Test', value: 0.5}] };
  const stroke = i => [...document.querySelectorAll('#view' + i + ' path, #view' + i + ' line')].find(el => el.__data__?.rowId === 'n0' && el.__data__?.colId === 'n1');
  store.dispatch(actions.addSelectedLink(link)); await settle(); assertReused();
  store.dispatch(actions.toggleAnnotationNode({id: 'n0', label: 'n0'})); await settle(); assertReused();
  store.dispatch(actions.updateAnnotation({id: 'default', color: '#123456'})); await settle(); assertReused();
  for (const i of [1, 2]) check(stroke(i)?.getAttribute('stroke') === '#123456', 'Link color did not update: ' + i);
  check(document.querySelector('#view0 .heatmap-selected rect')?.getAttribute('stroke') === '#123456', 'Matrix selection color did not update');
  check(document.querySelector('#view0 .heatmap-label[data-node-id="n0"] rect')?.getAttribute('fill') === '#123456', 'Matrix node color did not update');
  store.dispatch(actions.createNewAnnotation()); await settle(); assertReused();
  for (const i of [1, 2]) {
    const hit = [...document.querySelectorAll('#view' + i + ' path, #view' + i + ' line')].find(el => el.__data__?.rowId === 'n0' && el.__data__?.colId === 'n1' && el.__on?.some(event => event.type === 'click'));
    hit.dispatchEvent(new MouseEvent('click', {bubbles: true})); await settle(); assertReused();
    const current = store.getState().visualizationUi.annotations.at(-1);
    check(current.selectedLinks.length === (i === 1 ? 1 : 0), 'Scene callback used a stale annotation or selection');
  }
  store.dispatch(actions.selectAnnotation('default'));
  store.dispatch(actions.updateAnnotation({id: 'default', active: false})); await settle(); assertReused();
  check(!document.querySelector('#view0 .heatmap-selected rect'), 'Hidden annotation still highlighted');
  const bytes = await fetch('/examples/use_case_1.zip').then(response => response.arrayBuffer());
  const imported = await loadNetworkImportFromBytes('use_case_1.zip', bytes);
  const atlasDefinition = buildAtlasSourceFromNodeSet(imported.dataset.nodeSet, 'use_case_1.zip').atlas;
  const [activeId, otherId] = atlasDefinition.nodes.map(node => node.id);
  store.dispatch(actions.createNewAnnotation());
  store.dispatch(actions.toggleAnnotationNode({id: otherId, label: otherId}));
  store.dispatch(actions.createNewAnnotation());
  const host = document.body.appendChild(document.createElement('div'));
  let spatialError;
  const spatialRoot = createRoot(host, {onUncaughtError: error => { spatialError = error; }});
  let spatialScene;
  const originalAdd = THREE.Scene.prototype.add;
  THREE.Scene.prototype.add = function (...objects) { spatialScene = this; return originalAdd.apply(this, objects); };
  function SpatialProbe({ ids, isNetworkView = false, hideInactiveRois = false }) {
    const { containerRef } = useLinksAtlasScene({ atlasDefinition, has3d: true, spatialMode: 'geometry',
      isNetworkView, hideInactiveRois, highlightedNodeIds: new Set(ids), activeLinks: [] });
    return React.createElement('div', {ref: containerRef, style: {width: 400, height: 300}});
  }
  const draw = async (ids, options = {}) => {
    flushSync(() => spatialRoot.render(React.createElement(Provider, {store}, React.createElement(SpatialProbe, {ids, ...options}))));
    await settle();
    if (spatialError) throw spatialError;
    check(spatialScene, '3D scene must be created');
  };
  const assertRoi = (id, pointVisible, surfaceVisible, pointOpacity, surfaceOpacity) => {
    const meshes = [];
    spatialScene.traverse(object => { if (object.isMesh && object.userData.vafcaRoiId === id) meshes.push(object); });
    check(meshes.length >= 2, 'ROI must include a point and anatomical surface');
    for (const mesh of meshes) {
      const isPoint = mesh.userData.baseOpacity !== undefined;
      check(mesh.visible === (isPoint ? pointVisible : surfaceVisible), 'Unexpected ROI visibility: ' + id + (isPoint ? ' point' : ' surface') + ', got ' + mesh.visible);
      check(mesh.material.transparent, 'ROI material must support transparency');
      const expected = isPoint ? pointOpacity : surfaceOpacity;
      check(mesh.material.opacity === expected, 'Unexpected ROI opacity: ' + id + ' expected ' + expected + ', got ' + mesh.material.opacity);
    }
  };
  try {
    await draw([activeId]);
    assertRoi(activeId, true, true, SPATIAL_SCENE.pointOpacity, SPATIAL_ATLAS_HOVER_OPACITY);
    assertRoi(otherId, false, true, SPATIAL_SCENE.inactivePointOpacity, SPATIAL_ATLAS_CONTEXT_OPACITY);
    await draw([activeId], {hideInactiveRois: true});
    assertRoi(activeId, true, true, SPATIAL_SCENE.pointOpacity, SPATIAL_ATLAS_HOVER_OPACITY);
    assertRoi(otherId, false, false, SPATIAL_SCENE.inactivePointOpacity, SPATIAL_ATLAS_CONTEXT_OPACITY);
    await draw([]);
    assertRoi(activeId, false, true, SPATIAL_SCENE.inactivePointOpacity, SPATIAL_ATLAS_CONTEXT_OPACITY);
    assertRoi(otherId, false, true, SPATIAL_SCENE.inactivePointOpacity, SPATIAL_ATLAS_CONTEXT_OPACITY);
    await draw([otherId]);
    assertRoi(activeId, false, true, SPATIAL_SCENE.inactivePointOpacity, SPATIAL_ATLAS_CONTEXT_OPACITY);
    assertRoi(otherId, true, true, SPATIAL_SCENE.pointOpacity, SPATIAL_ATLAS_HOVER_OPACITY);
    await draw([otherId], {isNetworkView: true, hideInactiveRois: true});
    assertRoi(activeId, false, false, SPATIAL_SCENE.inactivePointOpacity, SPATIAL_ATLAS_CONTEXT_OPACITY);
    await draw([otherId], {isNetworkView: true});
    assertRoi(activeId, true, true, SPATIAL_SCENE.inactivePointOpacity, SPATIAL_ATLAS_CONTEXT_OPACITY);
    store.dispatch(setUploadedAtlas({atlas: atlasDefinition, fileName: 'use_case_1.zip'}));
    store.dispatch(actions.setAtlasPanelState({spatialMode: 'geometry', is3dAvailable: true}));
    host.style.cssText = 'width: 600px; height: 400px';
    flushSync(() => spatialRoot.render(React.createElement(Provider, {store}, React.createElement(SelectedLinksAtlas, {
      useAtlas3d: true, viewType: 'circular', nodeMode: 'connected', onViewTypeChange() {}, onNodeModeChange() {},
    }))));
    await settle();
    check(host.textContent.includes('Selected Nodes & Links'), 'Annotation view title must be stable');
    check(!host.querySelector('[aria-label="Filter 3D links"]'), 'Annotation 3D must not include focus filters');
    check(host.querySelectorAll('[aria-label="3D view controls"] button').length === 5, 'Only camera and inactive ROI buttons belong in 3D controls');
    const toggle = host.querySelector('button[aria-label="Hide inactive ROIs"]');
    check(toggle && toggle.getAttribute('aria-pressed') === 'false', 'Inactive surfaces are shown initially');
    flushSync(() => toggle.click()); await settle();
    check(host.querySelector('button[aria-label="Hide inactive ROIs"]').getAttribute('aria-pressed') === 'true', 'Inactive toggle must turn on');
    assertRoi(activeId, false, false, SPATIAL_SCENE.inactivePointOpacity, SPATIAL_ATLAS_CONTEXT_OPACITY);
    flushSync(() => host.querySelector('button[aria-label="Hide inactive ROIs"]').click()); await settle();
    check(host.querySelector('button[aria-label="Hide inactive ROIs"]').getAttribute('aria-pressed') === 'false', 'Inactive toggle must turn off');
    assertRoi(activeId, false, true, SPATIAL_SCENE.inactivePointOpacity, SPATIAL_ATLAS_CONTEXT_OPACITY);
    for (const label of ['2D', '3D']) {
      const selector = host.querySelector('[aria-label="Spatial representation"]');
      check(selector, 'Spatial selector must remain available in both views');
      selector.dispatchEvent(new MouseEvent('mousedown', {bubbles: true})); await settle();
      const option = [...document.querySelectorAll('.ant-select-item-option')].find(el => el.title === label);
      check(option, 'Spatial selector must offer ' + label);
      flushSync(() => option.click()); await settle();
      check(Boolean(host.querySelector('.links-atlas__canvas')) === (label === '3D'), 'Spatial selector must switch to ' + label);
      check(host.textContent.includes('Selected Nodes & Links'), 'Title must survive view changes');
    }
  } finally {
    spatialRoot.unmount(); host.remove(); THREE.Scene.prototype.add = originalAdd;
  }
  return 'Annotation checks pass: 2D/3D switching, title, camera controls, inactive surface toggle, point visibility and scene reuse.';
};
`;
const server = await createServer({ base: '/', server: { host: '127.0.0.1', port: 0 }, plugins: [{
  name: 'annotation-render-check',
  resolveId(id) { if (id === 'virtual:annotation-render-check') return '\0' + id; },
  load(id) { if (id === '\0virtual:annotation-render-check') return fixture; },
  configureServer(server) {
    server.middlewares.use('/__annotation_check', (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      void server.transformIndexHtml('/__annotation_check', '<style>.resizable-container{height:100%;width:100%}</style><div id="root"></div><script type="module" src="/@id/virtual:annotation-render-check"></script>').then(html => res.end(html));
    });
  },
}] });
const profile = await mkdtemp(join(tmpdir(), 'annotation-render-check-'));
let browser, socket;
try {
  const { populateSpatialLinks } = await server.ssrLoadModule('/src/components/selected-links/spatialLinks.ts');
  const { initialVisualizationUiState } = await server.ssrLoadModule('/src/store/slices/visualizationUi/visualizationUiTypes.ts');
  const style = initialVisualizationUiState.spatialVisualStyle;
  const group = new THREE.Group();
  const centers = new Map([['a', new THREE.Vector3()], ['b', new THREE.Vector3(1, 0, 0)]]);
  const link = { id: 'a::b', rowId: 'a', colId: 'b', rowLabel: 'A', colLabel: 'B', sources: [{ value: 2 }] };
  const draw = colors => populateSpatialLinks(group, centers, [link], style, {}, '#123456', false, new THREE.Vector2(200, 200), colors);
  draw({});
  const originalLine = group.children[0], geometry = originalLine.geometry, material = originalLine.material;
  draw({ 'a::b': '#ff0000' });
  assert.equal(group.children[0], originalLine, '3D line must survive annotation changes');
  assert.equal(originalLine.geometry, geometry);
  assert.equal(originalLine.material, material);
  assert.equal(material.color.getHexString(), 'ff0000');
  draw({});
  assert.equal(material.color.getHexString(), new THREE.Color(style.positiveLinkColor).getHexString());
  let disposed = false;
  geometry.addEventListener('dispose', () => { disposed = true; });
  populateSpatialLinks(group, centers, [], style, {}, '#123456', false, new THREE.Vector2(200, 200), {});
  assert.equal(group.children.length, 0);
  assert.ok(disposed, 'Removed links release their geometry');
  console.log('3D reuses lines, geometry and materials and releases removed links.');
  await server.listen();
  browser = spawn(process.env.CHROMIUM_BIN ?? 'chromium', ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const endpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error('Chromium startup timeout')), 20000);
    browser.once('error', reject);
    browser.stderr.on('data', bytes => { const match = bytes.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timeout); resolve(match[1]); } });
  });
  const port = new URL(endpoint).port;
  const targets = await fetch('http://127.0.0.1:' + port + '/json').then(r => r.json());
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', event => { const data = JSON.parse(event.data); pending.get(data.id)?.(data); pending.delete(data.id); });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const seq = ++id, timer = setTimeout(() => reject(Error('Browser command timeout: ' + method)), 30000);
    pending.set(seq, data => { clearTimeout(timer); resolve(data); });
    socket.send(JSON.stringify({ id: seq, method, params }));
  });
  const evaluate = async expression => {
    const response = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    assert.ok(!response.result?.exceptionDetails, JSON.stringify(response.result?.exceptionDetails));
    return response.result?.result?.value;
  };
  await call('Page.navigate', { url: server.resolvedUrls.local[0] + '__annotation_check' });
  for (let n = 0; n < 100; n++) {
    if (await evaluate('Boolean(window.checkRendering && document.querySelectorAll("svg").length === 3)')) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  console.log(await evaluate('window.checkRendering()'));
} finally {
  socket?.close(); browser?.kill('SIGKILL');
  await server.close();
  await rm(profile, { recursive: true, force: true });
}
