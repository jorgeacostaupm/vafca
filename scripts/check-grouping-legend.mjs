import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { buildEffectiveNodeEnabledMap, countChangedNodes } = await server.ssrLoadModule('/src/components/atlas/nodeVisibilityDraft.ts');
  const { default: atlasReducer, setAtlasLabels, setLabelsEnabled, setLabelsEnabledMap } = await server.ssrLoadModule('/src/store/slices/atlasUi/atlasUiSlice.ts');
  const { default: uiReducer, setAtlasPanelState, setShowGroupingLegend } = await server.ssrLoadModule('/src/store/slices/visualizationUi/visualizationUiSlice.ts');
  const { selectGroupingLegendVisible } = await server.ssrLoadModule('/src/store/slices/visualizationUi/visualizationUiSelectors.ts');
  let atlas = atlasReducer(undefined, setAtlasLabels({
    order: ['a', 'b', 'c'],
    labelsById: Object.fromEntries(['a', 'b', 'c'].map(id => [id, { id, label: id, enabled: true }])),
  }));
  let ui = uiReducer(undefined, { type: 'init' });
  for (const activeSection of ['vis', 'atlas', 'derive', 'links', 'catalogs', 'settings']) {
    const state = { visualizationUi: ui, workspaceUi: { activeSection } };
    assert.equal(selectGroupingLegendVisible(state), ['vis', 'atlas'].includes(activeSection));
    assert.equal(selectGroupingLegendVisible({ ...state, visualizationUi: uiReducer(ui, setShowGroupingLegend(false)) }), false);
  }
  ui = uiReducer(uiReducer(ui, setShowGroupingLegend(false)), setShowGroupingLegend(true));
  assert.equal(ui.showGroupingLegend, true);
  const { combinedReducer } = await server.ssrLoadModule('/src/store/rootReducer.ts');
  const { sessionSchema } = await server.ssrLoadModule('/src/workspace/sessionSchema.ts');
  const state = combinedReducer(undefined, { type: 'init' });
  const session = sessionSchema.parse({ ...state, visualizationUi: { ...state.visualizationUi, showGroupingLegend: false } });
  assert.equal(session.visualizationUi.showGroupingLegend, false, 'Sessions preserve a hidden legend');
  delete session.visualizationUi.showGroupingLegend;
  assert.equal(sessionSchema.parse(session).visualizationUi.showGroupingLegend, true, 'Older sessions keep the legend enabled');
  const args = () => ({ order: atlas.order, labelsById: atlas.labelsById, draft: ui.atlasPanel.nodeVisibilityDraft });

  // A legend action applies only its category and preserves other pending edits.
  ui = uiReducer(ui, setAtlasPanelState({ nodeVisibilityDraft: { a: false, b: false, c: false } }));
  const toggleCategory = setLabelsEnabled({ ids: ['a', 'b'], enabled: true });
  atlas = atlasReducer(atlas, toggleCategory);
  ui = uiReducer(ui, toggleCategory);
  assert.deepEqual(buildEffectiveNodeEnabledMap(args()), { a: true, b: true, c: false });
  assert.equal(atlas.labelsById.c.enabled, true, 'unrelated draft changes stay pending');
  assert.equal(countChangedNodes(args()), 1);
  atlas = atlasReducer(atlas, setLabelsEnabledMap(buildEffectiveNodeEnabledMap(args())));
  ui = uiReducer(ui, setAtlasPanelState({ nodeVisibilityDraft: null }));
  assert.deepEqual(buildEffectiveNodeEnabledMap(args()), { a: true, b: true, c: false });
  const hideCategory = setLabelsEnabled({ ids: ['a', 'b'], enabled: false });
  atlas = atlasReducer(atlas, hideCategory);
  ui = uiReducer(ui, hideCategory);
  assert.equal(ui.atlasPanel.nodeVisibilityDraft, null);
  assert.deepEqual(buildEffectiveNodeEnabledMap(args()), { a: false, b: false, c: false });

  const { buildNodeGroupingColorCategories, buildGroupingColorCategoryKey } = await server.ssrLoadModule('/src/utils/groupingColoring.ts');
  const categories = buildNodeGroupingColorCategories({
    atlasDefinition: { nodes: [
      { id: 'a', metadata: { group: 'X' } },
      { id: 'b', metadata: { group: 'X' } },
      { id: 'c', metadata: { group: 'Y' } },
    ] }, groupingFields: ['group'], colorPalette: atlas.colorPalette,
  });
  assert.deepEqual(categories.map(category => category.nodeIds), [['a', 'b'], ['c']]);
  assert.notEqual(buildGroupingColorCategoryKey(['a||b', 'c']), buildGroupingColorCategoryKey(['a', 'b||c']));
  console.log('Atlas visibility draft and grouping legend checks passed.');
} finally {
  await server.close();
}
