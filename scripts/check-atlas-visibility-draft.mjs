import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { buildEffectiveNodeEnabledMap, countChangedNodes } = await server.ssrLoadModule('/src/components/atlas/nodeVisibilityDraft.ts');
  const { default: atlasReducer, setAtlasLabels, setLabelsEnabledMap } = await server.ssrLoadModule('/src/store/slices/atlasUi/atlasUiSlice.ts');
  const { default: uiReducer, setAtlasPanelState } = await server.ssrLoadModule('/src/store/slices/visualizationUi/visualizationUiSlice.ts');
  let atlas = atlasReducer(undefined, setAtlasLabels({
    order: ['a', 'b', 'c'],
    labelsById: Object.fromEntries(['a', 'b', 'c'].map(id => [id, { id, label: id, enabled: true }])),
  }));
  let ui = uiReducer(undefined, { type: 'init' });
  const args = () => ({ order: atlas.order, labelsById: atlas.labelsById, draft: ui.atlasPanel.nodeVisibilityDraft });

  // Guard the 3D wiring as well as the draft/apply state transitions, without WebGL.
  const scene = readFileSync('src/components/atlas/hooks/useAtlasScene.ts', 'utf8');
  const viewer = readFileSync('src/components/atlas/AtlasPanelViewer.tsx', 'utf8');
  assert.doesNotMatch(scene, /setLabelEnabled|useSpatialSelection|toggleAnnotationNode/);
  assert.match(scene, /getHighlightColor:[^\n]+latest\.current\.nodeColors/);
  const list = readFileSync('src/components/atlas/AtlasNodeListItem.tsx', 'utf8');
  assert.doesNotMatch(list, /toggleAnnotationNode|Annotate/);
  assert.match(list, /color: hasColoring \? nodeColors\[id\] : undefined/);
  assert.match(viewer, /draft: state\.visualizationUi\.atlasPanel\.nodeVisibilityDraft/);
  const draftExpression = scene.match(/const nodeVisibilityDraft = (\{[^\n]+\});/);
  assert.ok(draftExpression, '3D selection must write the visibility draft');
  const hideNode = new Function('enabled', 'id', `return (${draftExpression[1]});`);

  ui = uiReducer(ui, setAtlasPanelState({ nodeVisibilityDraft: { a: false, b: true, c: true } }));
  ui = uiReducer(ui, setAtlasPanelState({
    nodeVisibilityDraft: hideNode(buildEffectiveNodeEnabledMap(args()), 'b'),
  }));
  assert.deepEqual(buildEffectiveNodeEnabledMap(args()), { a: false, b: false, c: true });
  assert.equal(countChangedNodes(args()), 2, 'Apply must include both list and 3D changes');
  assert.ok(atlas.order.every(id => atlas.labelsById[id].enabled), 'changes stay pending until Apply');

  atlas = atlasReducer(atlas, setLabelsEnabledMap(buildEffectiveNodeEnabledMap(args())));
  ui = uiReducer(ui, setAtlasPanelState({ nodeVisibilityDraft: null }));
  assert.equal(countChangedNodes(args()), 0);
  ui = uiReducer(ui, setAtlasPanelState({ showInactiveNodes: true }));
  assert.equal(ui.atlasPanel.showInactiveNodes, true);
  assert.deepEqual(buildEffectiveNodeEnabledMap(args()), { a: false, b: false, c: true }, 'showing inactive nodes must not enable them');
  ui = uiReducer(ui, setAtlasPanelState({
    nodeVisibilityDraft: hideNode(buildEffectiveNodeEnabledMap(args()), 'b'),
  }));
  assert.deepEqual(buildEffectiveNodeEnabledMap(args()), { a: false, b: true, c: true });
  assert.equal(countChangedNodes(args()), 1, 'reactivation stays pending until Apply');
  ui = uiReducer(ui, setAtlasPanelState({ nodeVisibilityDraft: null }));
  assert.deepEqual(buildEffectiveNodeEnabledMap(args()), { a: false, b: false, c: true });
  console.log('Atlas visibility draft checks passed.');
} finally {
  await server.close();
}
