import type { Catalogs, Network } from '@/types/network'


export const dimensionKey = (dimensions: Record<string, string>) =>
  JSON.stringify(Object.entries(dimensions).sort(([a], [b]) => a.localeCompare(b)))

export const sameDimensions = (left: Record<string, string>, right: Record<string, string>) =>
  dimensionKey(left) === dimensionKey(right)

export const dimensionLabel = (catalogs: Catalogs, dimensions: Record<string, string>) =>
  catalogs.aspects.map(({ id, label }) =>
    `${label}: ${catalogs.aspectCatalogs[id]?.[dimensions[id]]?.label ?? dimensions[id]}`,
  ).join(' · ') || 'No dimensions'

export const networkDimensionContexts = (networks: Network[]) =>
  [...new Map(networks.map(({ dimensions }) => [dimensionKey(dimensions), dimensions])).values()]

