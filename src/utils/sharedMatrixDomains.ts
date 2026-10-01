import type { MaterializedNetworkView } from '@/types/datasetNetworkView';
import type { Catalogs, Network, NetworkDataStatsBucket } from '@/types/network';
import type { ResolvedValueDomain } from '@/types/valueDomain';
import { getNetworkDataStats, resolveValueDomain } from '@/utils/valueDomain';

type MatrixEntry = { viewId: string; network: Network | MaterializedNetworkView };

export const buildSharedMatrixDomains = (entries: MatrixEntry[], catalogs?: Catalogs) => {
  const groups = new Map<string, { entries: MatrixEntry[]; stats: NetworkDataStatsBucket }>();
  const statsByNetwork = new Map<MatrixEntry['network'], NetworkDataStatsBucket>();
  for (const entry of entries) {
    const { network } = entry;
    const key = JSON.stringify([network.measureId, network.statisticId]);
    let group = groups.get(key);
    if (!group) {
      group = { entries: [], stats: { min: null, max: null, absMax: null, finiteCount: 0, nullCount: 0 } };
      groups.set(key, group);
    }
    group.entries.push(entry);
    const stats = statsByNetwork.get(network) ?? getNetworkDataStats(network).allValues;
    statsByNetwork.set(network, stats);
    if (stats.min !== null && stats.max !== null) {
      group.stats.min = Math.min(group.stats.min ?? stats.min, stats.min);
      group.stats.max = Math.max(group.stats.max ?? stats.max, stats.max);
      group.stats.absMax = Math.max(group.stats.absMax ?? 0, Math.abs(stats.min), Math.abs(stats.max));
    }
    group.stats.finiteCount += stats.finiteCount;
    group.stats.nullCount += stats.nullCount;
  }
  const domains: Record<string, ResolvedValueDomain> = {};
  for (const { entries: members, stats } of groups.values()) {
    const domain = resolveValueDomain({
      network: { ...members[0].network, dataStats: { allValues: stats } },
      catalogs,
      mode: 'shared',
    });
    for (const { viewId } of members) {
      domains[viewId] = { ...domain, source: domain.source === 'fallback' ? 'fallback' : 'shared' };
    }
  }
  return domains;
};
