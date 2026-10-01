import assert from 'node:assert/strict';
import { filterLinksAtlas } from '../src/components/selected-links/linksAtlasFocus.ts';
const nodes = [
  { id: 'a', atlasId: 1, metadata: { module: 'x' } },
  { id: 'b', atlasId: 2, metadata: { module: 'x' } },
  { id: 'c', atlasId: 3, metadata: { module: 'y' } },
];
const links = [{ rowId: '1', colId: 'b' }, { rowId: 'c', colId: 'a' }, { rowId: 'b', colId: '3' }];
assert.deepEqual(filterLinksAtlas(links, nodes), links);
assert.deepEqual(filterLinksAtlas(links, nodes, 'a'), links.slice(0, 2));
assert.deepEqual(filterLinksAtlas(links, nodes, undefined, 'module', 'x'), [links[0]]);
assert.deepEqual(filterLinksAtlas(links, nodes, 'c', 'module', 'x'), []);
assert.deepEqual(filterLinksAtlas(links, nodes, undefined, 'module', 'missing'), []);
assert.deepEqual(filterLinksAtlas([{ rowId: 'unknown', colId: 'a' }], nodes, undefined, 'module', 'x'), []);
console.log('3D link focus checks passed');
