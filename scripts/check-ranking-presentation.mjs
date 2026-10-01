import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { getRankingDimensions, getRankingDimensionValue } = await server.ssrLoadModule('/src/utils/rankings/rankingPresentation.ts');
  const { formatRankingPanelTitle } = await server.ssrLoadModule('/src/components/rankings/rankingOptions.ts');
  const networks = ['alpha', 'beta'].map((band, index) => ({ id: band, sourceId: 'control', nodeIds: ['a', 'b'], nodeSetId: 'nodes', dimensions: { band, session: `s${index}` }, measureId: 'plv', statisticId: 'mean' }));
  const dataset = {
    networks, networkIndex: Object.fromEntries(networks.map(network => [network.id, network])),
    catalogs: { core: { source: { label: 'Source' } }, sources: { control: { label: 'Control', kind: 'population' } },
      aspects: [{ id: 'band', label: 'Band' }, { id: 'session', label: 'Session' }],
      aspectCatalogs: { band: { alpha: { label: 'Alpha' }, beta: { label: 'Beta' } }, session: {} } },
  };
  const query = { target: 'links', metric: 'highestValue', sourceIds: ['control'], aspectFilters: { band: ['alpha', 'beta'] } };
  const row = { type: 'link', networkSourceId: 'control', valuesByNetwork: { alpha: -0.9, beta: 0.6 } };
  assert.deepEqual(getRankingDimensions(query, dataset).map(d => d.values.length), [1, 2, 2]);
  assert.equal(getRankingDimensions({ ...query, aspectFilters: { band: ['__all_compatible__'] } }, dataset)[1].values.length, 2);
  assert.equal(getRankingDimensions({ ...query, aspectFilters: { band: ['alpha'] } }, dataset)[1].values.length, 1);
  assert.equal(getRankingDimensionValue(row, 'band', query, dataset), 'Beta');
  assert.equal(getRankingDimensionValue(row, 'band', { ...query, metric: 'lowestValue' }, dataset), 'Alpha');
  assert.equal(getRankingDimensionValue(row, 'band', { ...query, metric: 'highestAbsValue' }, dataset), 'Alpha');
  assert.equal(getRankingDimensionValue(row, 'band', { ...query, metric: 'meanAcrossMatrices' }, dataset), undefined);
  assert.equal(getRankingDimensionValue({ ...row, valuesByNetwork: { alpha: 0.6, beta: 0.6 } }, 'band', query, dataset), 'Alpha, Beta');
  assert.equal(getRankingDimensionValue({ ...row, valuesByNetwork: { alpha: -0.9 } }, 'session', query, dataset), 's0');
  for (const [target, title] of [['networks', 'Network'], ['links', 'Link'], ['nodes', 'Node']]) {
    assert.equal(formatRankingPanelTitle({ query: { ...query, target, measureId: 'plv' } }, { catalogs: { measures: { plv: { label: 'PLV' } } } }), `${title} Ranking · PLV`);
  }
  assert.equal(formatRankingPanelTitle({ query: { ...query, measureId: 'plv' } }), 'Link Ranking · plv');
  console.log('Ranking presentation checks passed.');
} finally { await server.close(); }
