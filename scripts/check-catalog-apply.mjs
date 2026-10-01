import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);

// Exercise the actual component handlers with isolated hook state and dispatch.
for (const section of ['Source', 'Aspect']) {
  const original = { id: 'a', label: 'Original', enabled: true };
  const catalogs = {
    sources: { a: original },
    aspects: [{ id: 'first', label: 'First' }, { id: 'second', label: 'Second' }],
    aspectCatalogs: { first: { a: original }, second: { a: original } },
  };
  const state = { dataset: { id: 'dataset', catalogs } };
  const slots = [];
  const updates = [];
  let cursor = 0;
  const modules = {
    react: { useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    } },
    antd: { Button: 'Button', Card: 'Card', Input: Object.assign('Input', { TextArea: 'TextArea' }), Space: 'Space', Switch: 'Switch', Tabs: 'Tabs', Typography: { Text: 'Text', Title: 'Title' } },
    '@ant-design/icons': { CheckOutlined: 'CheckOutlined' },
    '@/store/hooks': { useAppSelector: selector => selector(state) },
    '@/store/slices/dataset': { selectDatasetContent: () => ({ catalogs }) },
    '@/components/management/utils/catalogValues': { isEnabled: item => item.enabled !== false },
    '@/components/management/components/catalogs/useCatalogItemUpdater': {
      useCatalogItemUpdater: () => (...args) => updates.push(args),
    },
  };
  const code = ts.transpileModule(readFileSync(
    `src/components/management/components/catalogs/${section}CatalogSection.tsx`, 'utf8',
  ), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(name => modules[name] ?? require(name), exports);
  const render = () => { cursor = 0; return exports.default(); };
  const descendants = node => !node || typeof node !== 'object' ? [] : [
    node, ...[node.props?.children, ...(node.props?.items ?? []).map(item => item.children)]
      .flat(Infinity).flatMap(descendants),
  ];
  const controls = type => descendants(render()).filter(node => node.type === type);
  assert.equal(controls('Button')[0].props.disabled, true);
  controls('Switch')[0].props.onChange(false);
  assert.equal(updates.length, 0, 'editing must not dispatch');
  assert.equal(original.enabled, true, 'editing must not mutate the dataset');
  assert.equal(controls('Switch')[0].props.checked, false, 'draft must be visible');
  if (section === 'Aspect') controls('Switch')[1].props.onChange(false);
  controls('Button')[0].props.onClick();
  assert.deepEqual(updates[0], section === 'Source'
    ? ['sources', 'a', { enabled: false }]
    : ['aspectCatalogs', 'a', { enabled: false }, 'first']);
  assert.equal(controls('Button')[0].props.disabled, true);
  if (section === 'Aspect') {
    assert.equal(controls('Button')[1].props.disabled, false, 'other aspect drafts survive Apply');
    controls('Button')[1].props.onClick();
    assert.equal(updates[1][3], 'second', 'same item IDs in different aspects stay independent');
  }
}
console.log('Catalog Apply checks passed.');
