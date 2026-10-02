import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
let slots = [], cursor = 0, rerender = false;
const modules = {
  react: { useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], value => {
      slots[index] = typeof value === 'function' ? value(slots[index]) : value;
      rerender = true;
    }];
  } },
};
const load = file => {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(name => modules[name] ?? require(name), exports);
  return exports;
};
const { useSettingsDraft } = load('src/components/network/settings/useSettingsDraft.ts');
const render = callback => {
  let result;
  for (let attempt = 0; attempt < 10; attempt++) {
    cursor = 0; rerender = false;
    result = callback();
    if (!rerender) return result;
  }
  assert.fail('Draft never settled after an external change');
};
let applied = { positive: '#112233', negative: '#445566' };
let draft = render(() => useSettingsDraft(applied));
draft.patch({ positive: '#ffffff' });
draft.patch({ negative: '#000000' });
draft = render(() => useSettingsDraft({ ...applied }));
assert.deepEqual(draft.value, { positive: '#ffffff', negative: '#000000' });
assert.equal(draft.hasChanges, true);
assert.deepEqual(applied, { positive: '#112233', negative: '#445566' });
draft.reset();
assert.equal(render(() => useSettingsDraft(applied)).hasChanges, false);
draft.patch({ positive: '#ffffff' });
applied = { positive: '#778899', negative: '#abcdef' };
draft = render(() => useSettingsDraft(applied));
assert.deepEqual(draft.value, applied);
assert.equal(draft.hasChanges, false);
applied = { positive: '#112233', negative: '#445566' };
assert.deepEqual(render(() => useSettingsDraft(applied)).value, applied, 'Old drafts must not reappear');
draft = render(() => useSettingsDraft(applied));
draft.patch({ positive: '#000000' });
applied = render(() => useSettingsDraft(applied)).value;
assert.equal(render(() => useSettingsDraft(applied)).hasChanges, false, 'Apply establishes a new baseline');

slots = [];
const equalFields = (first, second) => JSON.stringify(first.fields) === JSON.stringify(second.fields);
const ordering = { fields: ['network', 'hemisphere'] };
draft = render(() => useSettingsDraft(ordering, equalFields));
draft.set({ fields: ['hemisphere'] });
assert.deepEqual(render(() => useSettingsDraft({ fields: [...ordering.fields] }, equalFields)).value.fields, ['hemisphere']);
assert.deepEqual(render(() => useSettingsDraft({ fields: [] }, equalFields)).value.fields, [], 'External ordering changes discard a nested draft');

// Exercise the actual color forms while their applied Redux values are replaced.
for (const name of ['NodeLink', 'Spatial']) {
  slots = [];
  const styleKey = name === 'NodeLink' ? 'nodeLinkVisualStyle' : 'spatialVisualStyle';
  const state = { visualizationUi: { [styleKey]: {
    nodeColor: '#112233', divergingNodeColor: '#223344', positiveLinkColor: '#334455',
    negativeLinkColor: '#445566', neutralLinkColor: '#556677', highlightColor: '#667788', selectionColor: '#778899',
  } } };
  const dispatched = [];
  modules.antd = { ColorPicker: 'ColorPicker', Form: Object.assign('Form', { Item: 'FormItem' }) };
  modules['@/store/hooks'] = { useAppSelector: selector => selector(state), useAppDispatch: () => action => dispatched.push(action) };
  modules['@/components/common/SettingsSection'] = { default: 'Section' };
  modules['@/components/common/SettingsActions'] = { default: 'Actions' };
  modules['./useSettingsDraft'] = { useSettingsDraft };
  modules['@/config/matrixColorScales'] = {};
  const actions = {
    selectNodeLinkVisualStyle: state => state.visualizationUi.nodeLinkVisualStyle,
    setNodeLinkLinkColor: payload => ({ type: 'link', payload }),
    setNodeLinkInteractionColor: payload => ({ type: 'interaction', payload }),
    setSpatialVisualStyle: payload => ({ type: 'spatial', payload }),
  };
  modules['@/store/slices/visualizationUi'] = actions;
  modules['@/store/slices/visualizationUi/visualizationUiSlice'] = actions;
  const Component = load(`src/components/network/settings/${name}SettingsTab.tsx`).default;
  const descendants = node => !node || typeof node !== 'object' ? [] : [node,
    ...[node.props?.children].flat(Infinity).flatMap(descendants)];
  const controls = type => descendants(render(Component)).filter(node => node.type === type);
  controls('ColorPicker')[0].props.onChange({ toHexString: () => '#ffffff' });
  assert.equal(dispatched.length, 0, 'Editing must not apply settings');
  assert.equal(controls('Actions')[0].props.hasChanges, true);
  state.visualizationUi[styleKey] = Object.fromEntries(Object.keys(state.visualizationUi[styleKey]).map(key => [key, '#abcdef']));
  assert.ok(controls('ColorPicker').every(node => node.props.value === '#abcdef'));
  assert.equal(controls('Actions')[0].props.hasChanges, false);
  controls('Actions')[0].props.onApply();
  assert.ok(dispatched.every(action => action.payload.color === '#abcdef' || action.payload.positiveLinkColor === '#abcdef'));
}
console.log('Settings draft checks passed: edit, reset, external restore, and color form Apply.');
