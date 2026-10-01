import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { toMatrixStatFilter, toNodeLinkStatFilter } = await server.ssrLoadModule('/src/components/network/networkFormatting.ts');
  const { valuePassesRangeFilter } = await server.ssrLoadModule('/src/utils/matrixFiltering.ts');
  const { setStatRange } = await server.ssrLoadModule('/src/store/slices/networkVisualization/reducers/networkVisualizationReducerUtils.ts');
  const settings = {};
  const fallback = { negative: [-1, 0], positive: [0, 1] };
  for (const convert of [toMatrixStatFilter, toNodeLinkStatFilter]) {
    for (const negativeEnabled of [true, false]) {
      for (const positiveEnabled of [true, false]) {
        const filter = convert({ ...fallback, negativeEnabled, positiveEnabled });
        assert.equal(valuePassesRangeFilter(-0.5, filter), negativeEnabled);
        assert.equal(valuePassesRangeFilter(0.5, filter), positiveEnabled);
        assert.equal(valuePassesRangeFilter(0, filter), negativeEnabled || positiveEnabled);
      }
    }
    assert.equal(valuePassesRangeFilter(-0.5, convert(fallback)), true);
    assert.equal(valuePassesRangeFilter(0.5, convert(undefined)), true);
  }
  setStatRange(settings, [-1, 0], 'negative', fallback, false);
  setStatRange(settings, [0.2, 0.8], 'positive');
  assert.equal(settings.statRange.negativeEnabled, false);
  setStatRange(settings, [-1, 0], 'negative', undefined, true);
  assert.deepEqual(settings.statRange.negative, [-1, 0]);
  assert.deepEqual(settings.statRange.positive, [0.2, 0.8]);
  assert.equal(settings.statRange.negativeEnabled, true);
  console.log('Range filter checks passed.');
} finally {
  await server.close();
}
