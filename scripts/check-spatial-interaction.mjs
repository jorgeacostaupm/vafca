import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { createServer } from 'vite';

const styles = await readFile(new URL('../src/styles/features/selected-links.css', import.meta.url), 'utf8');
for (const selector of ['.links-atlas__canvas', '.network-links-3d__canvas']) {
  const rule = styles.slice(styles.indexOf(`${selector} {`)).split('}')[0];
  assert.match(rule, /position:\s*relative\s*;/, `${selector} anchors its tooltip like Node Management`);
}

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const frames = [];
globalThis.window = { requestAnimationFrame: callback => { frames.push(callback); return frames.length; } };
class Element extends EventTarget {
  style = {}; offsetWidth = 30; offsetHeight = 20;
  setAttribute() {} appendChild() {} remove() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 200, height: 200 }; }
}
try {
  const { bindSpatialInteraction } = await server.ssrLoadModule('/src/components/selected-links/spatialInteraction.ts');
  const { getSharedHoverState, setSharedHoverState } = await server.ssrLoadModule('/src/components/hover/sharedHover.ts');
  const { roiTooltip } = await server.ssrLoadModule('/src/spatial/roiTooltip.ts');
  const tooltip = new Element();
  globalThis.document = { createElement: () => tooltip };
  const canvas = new Element();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, 1); camera.updateMatrixWorld();
  const atlasMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07), new THREE.MeshStandardMaterial());
  atlasMesh.position.set(0.15, 0, 0); atlasMesh.updateMatrixWorld();
  atlasMesh.userData = { nodeId: 'roi', vafcaRoiId: 'roi' };
  const point = atlasMesh.clone();
  point.material = atlasMesh.material.clone();
  const group = new THREE.Group(); group.add(atlasMesh, point); group.updateMatrixWorld(true);
  const link = { id: 'roi::b', rowId: 'roi', colId: 'b', rowLabel: 'ROI', colLabel: 'B', sources: [{ value: 2 }] };
  const line = new Line2(new LineGeometry().setPositions([-0.2, -0.2, 0, 0.2, -0.2, 0]), new LineMaterial({ linewidth: 3 }));
  line.material.resolution.set(200, 200); line.userData = { link, width: 3 };
  const links = new THREE.Group(); links.add(line); links.updateMatrixWorld(true);
  const selectedNodes = []; const selectedLinks = [];
  let annotationHighlight = '#123456';
  const binding = bindSpatialInteraction({ container: canvas, canvas, camera, nodes: new Map([['roi', point]]), links, atlasMeshes: [atlasMesh],
    getHighlightColor: () => annotationHighlight,
    labels: () => ({}), select: value => selectedLinks.push(value), selectNode: id => selectedNodes.push(id),
    nodeTooltip: id => roiTooltip({ id, name: 'Scientific ROI', metadata: { lobe: 'Temporal' } }, id),
  });
  const send = (type, x, y, buttons = 0) => {
    const event = new Event(type);
    Object.assign(event, { clientX: x, clientY: y, button: 0, buttons, pointerId: 1 });
    canvas.dispatchEvent(event);
    frames.splice(0).forEach(callback => callback());
  };
  send('pointermove', 132, 100);
  assert.equal(point.material.color.getHexString(), '123456', 'Node hover uses the annotation color');
  assert.match(tooltip.textContent, /Scientific ROI\nroi\nlobe: Temporal/);
  assert.deepEqual(getSharedHoverState(), { type: 'node', nodeId: 'roi' });
  send('pointerdown', 132, 100); send('pointerup', 132, 100);
  assert.deepEqual(selectedNodes, ['roi']);
  assert.equal(selectedLinks.length, 0, 'Clicking an anatomical ROI does not select incident links');
  assert.equal(line.visible, true, 'ROI clicks do not create a separate local focus state');
  send('pointerdown', 132, 100); send('pointermove', 150, 100, 1); send('pointerup', 132, 100);
  assert.equal(selectedNodes.length, 1, 'Orbit drag never becomes a selection');
  send('pointermove', 100, 140);
  assert.deepEqual(getSharedHoverState(), { type: 'cell', rowId: 'roi', colId: 'b' });
  assert.equal(line.material.color.getHexString(), '123456', 'Link hover uses the annotation color');
  annotationHighlight = '#ff0000';
  binding.refresh();
  assert.equal(line.material.color.getHexString(), 'ff0000', 'Hover follows overlap or annotation color changes');
  send('pointerdown', 100, 140); send('pointerup', 100, 140);
  assert.deepEqual(selectedLinks, [link]);
  atlasMesh.position.set(0, -0.2, 0.15); group.updateMatrixWorld(true);
  send('pointerdown', 100, 140); send('pointerup', 100, 140);
  assert.equal(selectedLinks.length, 2, 'Atlas lookup meshes do not intercept link picking');
  atlasMesh.position.set(0.15, 0, 0); group.updateMatrixWorld(true);
  links.clear();
  send('pointermove', 132, 100);
  assert.equal(tooltip.style.opacity, '1', 'Anatomical ROIs remain interactive without functional links');
  point.visible = false;
  send('pointermove', 132, 100);
  assert.equal(tooltip.style.opacity, '0', 'Anatomical surfaces do not receive hover when the point is hidden');
  assert.equal(getSharedHoverState(), null);
  binding.dispose();
  frames.splice(0).forEach(callback => callback());
  const globalHover = { type: 'node', nodeId: 'another-view' };
  setSharedHoverState(globalHover);
  frames.splice(0).forEach(callback => callback());
  const localHover = [];
  point.visible = true;
  const independent = bindSpatialInteraction({ container: canvas, canvas, camera,
    nodes: new Map([['roi', point]]), links, atlasMeshes: [atlasMesh], labels: () => ({}), select: () => {},
    nodeTooltip: () => 'Management ROI information', onHover: hover => localHover.push(hover),
  });
  send('pointermove', 132, 100);
  assert.equal(tooltip.textContent, 'Management ROI information');
  assert.deepEqual(localHover.at(-1), { type: 'node', nodeId: 'roi' });
  assert.deepEqual(getSharedHoverState(), globalHover, 'Management hover does not publish global hover');
  send('pointerdown', 132, 100); send('pointerup', 132, 100);
  assert.equal(selectedNodes.length, 1, 'Management points do not select ROIs');
  independent.dispose();
  assert.deepEqual(getSharedHoverState(), globalHover, 'Management cleanup does not change global hover');
  point.material.dispose(); atlasMesh.geometry.dispose(); atlasMesh.material.dispose(); line.geometry.dispose(); line.material.dispose();
  console.log('Spatial interaction checks passed: ROI identity, metadata, shared hover, node/link selection, drag guard and visibility.');
} finally { delete globalThis.document; delete globalThis.window; await server.close(); }
