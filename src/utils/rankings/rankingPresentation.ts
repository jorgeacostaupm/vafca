import type { Network, NetworkDataset } from '@/types/network'
import type { RankingQuery, RankingRow } from '@/types/rankings'
import { ALL_COMPATIBLE_ASPECT_VALUES, getRankingQuerySourceIds, resolveRankingNetworkCollection } from '@/utils/rankings/rankingNetworkMetadata'

export const getRankingDimensions = (query: RankingQuery, dataset: NetworkDataset) => {
  const networks = resolveRankingNetworkCollection(dataset, query)
  const selectedValues = (selected: string[] | undefined, actual: string[]) =>
    [...new Set(selected?.length && !selected.includes(ALL_COMPATIBLE_ASPECT_VALUES) ? selected : actual)]
  return [
    {
      id: 'source', label: dataset.catalogs.core.source.label,
      values: selectedValues(getRankingQuerySourceIds(query), networks.map(network => network.sourceId)),
      labelFor: (id: string) => dataset.catalogs.sources[id]?.label ?? id,
    },
    ...dataset.catalogs.aspects.map(aspect => ({
      id: aspect.id, label: aspect.label,
      values: selectedValues(query.aspectFilters?.[aspect.id], networks.flatMap(network => network.dimensions[aspect.id] ? [network.dimensions[aspect.id]] : [])),
      labelFor: (id: string) => dataset.catalogs.aspectCatalogs[aspect.id]?.[id]?.label ?? id,
    })),
  ]
}

export const getRankingExtremeLabel = (query: RankingQuery) => {
  if (query.metric === 'highestValue') return 'maximum'
  if (query.metric === 'lowestValue') return 'minimum'
  if (query.metric === 'highestAbsValue') return 'absolute maximum'
  return undefined
}

export const getRankingDimensionValue = (
  row: RankingRow, dimension: string, query: RankingQuery, dataset: NetworkDataset,
) => {
  if (dimension === 'source') return row.type === 'network' ? row.sourceId : row.networkSourceId
  if (row.type === 'network') return row.dimensions[dimension]
  if (row.type !== 'link') return undefined
  const entries = Object.entries(row.valuesByNetwork ?? {}).filter(([, value]) => Number.isFinite(value))
  // ponytail: inspect the contributing matrices; ties list every matching dimension value.
  let networks: Network[] = []
  if (entries.length) {
    const extreme = getRankingExtremeLabel(query)
    const comparable = (value: number) => query.metric === 'highestAbsValue' ? Math.abs(value) : value
    const scores = entries.map(([, value]) => comparable(value))
    const best = query.metric === 'lowestValue' ? Math.min(...scores) : Math.max(...scores)
    networks = entries.filter(([, value]) => !extreme || comparable(value) === best)
      .flatMap(([id]) => dataset.networkIndex[id] ? [dataset.networkIndex[id]] : [])
  } else if (row.bestNetworkId && (query.linkCollectionMode === 'expanded' || row.nNetworksUsed === 1)) {
    networks = dataset.networkIndex[row.bestNetworkId] ? [dataset.networkIndex[row.bestNetworkId]] : []
  }
  const values = [...new Set(networks.flatMap(network => network.dimensions[dimension] ? [network.dimensions[dimension]] : []))]
  if (!getRankingExtremeLabel(query) && values.length > 1) return undefined
  return values.map(value => dataset.catalogs.aspectCatalogs[dimension]?.[value]?.label ?? value).join(', ') || undefined
}
