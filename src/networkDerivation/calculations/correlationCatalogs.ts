import type { CatalogItem, Catalogs, ComparisonNetworkInput, Network, Source, Statistic } from '@/types/network'

const field = (
  left: string | undefined,
  right: string | undefined,
  catalog: Record<string, CatalogItem> = {},
  operator?: 'pearson_contribution',
): CatalogItem => {
  if (left === right && left !== undefined && !operator) return { id: left, label: catalog[left]?.label ?? left }
  const values: [string | null, string | null] = [left ?? null, right ?? null]
  values.sort((a, b) => a === b ? 0 : a === null ? -1 : b === null ? 1 : a < b ? -1 : 1)
  const label = [...new Set(values)].map(id => id === null ? 'Not specified' : catalog[id]?.label ?? id).join(' ↔ ')
  return {
    id: `correlation-${operator ?? 'pair'}:${encodeURIComponent(JSON.stringify(values))}`,
    label: operator ? `Pearson contribution · ${label}` : label,
    comparison: { values, ...(operator ? { operator } : {}) },
    enabled: true,
  }
}

export const correlationInput = (network: Network): ComparisonNetworkInput => ({
  id: network.id, sourceId: network.sourceId, measureId: network.measureId,
  statisticId: network.statisticId, dimensions: { ...network.dimensions },
})

export const correlationCatalogEntries = (
  [left, right]: [ComparisonNetworkInput, ComparisonNetworkInput],
  catalogs: Catalogs,
) => {
  const source = field(left.sourceId, right.sourceId, catalogs.sources)
  const statistic = field(left.statisticId, right.statisticId, catalogs.statistics, 'pearson_contribution')
  return {
    source: { ...source, kind: source.comparison ? 'comparison' : catalogs.sources[left.sourceId]?.kind ?? 'population',
      ...(source.comparison ? { left: source.comparison.values[0]!, right: source.comparison.values[1]! } : {}),
    } satisfies Source,
    measure: field(left.measureId, right.measureId, catalogs.measures),
    statistic: { ...statistic, category: 'comparison', scaleType: 'diverging', center: 0,
      rangeMode: 'observed_symmetric', useDataRange: true } satisfies Statistic,
    aspects: Object.fromEntries([...new Set([...Object.keys(left.dimensions), ...Object.keys(right.dimensions)])]
      .map(id => [id, field(left.dimensions[id], right.dimensions[id], catalogs.aspectCatalogs?.[id])])),
  }
}
