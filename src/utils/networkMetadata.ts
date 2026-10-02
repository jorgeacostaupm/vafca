import type { Network, NetworkDataset, SourceKind } from "@/types/network";

const dimensionsKey = (dimensions: Record<string, string>) =>
  Object.entries(dimensions)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join("::");

export const getNetworkSourceKind = (
  network: Network,
  dataset?: Pick<NetworkDataset, "catalogs"> | null,
): SourceKind => dataset?.catalogs.sources[network.sourceId]?.kind ?? "population";

export const formatNetworkSourceLabel = (
  network: Network,
  dataset: NetworkDataset,
) => dataset.catalogs.sources[network.sourceId]?.label ?? network.sourceId;

export const createNetworkCompoundId = (network: Network) =>
  [
    network.sourceId,
    network.measureId,
    network.statisticId,
    dimensionsKey(network.dimensions),
    // Shared comparison sources can contain multiple results with the same statistic.
    // Keep legacy compound IDs unchanged so saved workspace references still resolve.
    ...(network.derivation?.type === "comparison" && network.derivation.parameters?.sourceGrouping === "endpoints"
      ? [network.id] : []),
  ].join("::");

export const formatNetworkLabel = (
  network: Network,
  dataset: NetworkDataset,
) => {
  if (network.label) return network.label;
  const source = formatNetworkSourceLabel(network, dataset);
  const measure =
    dataset.catalogs.measures[network.measureId]?.label ?? network.measureId;
  const statistic =
    dataset.catalogs.statistics[network.statisticId]?.label ??
    network.statisticId;
  const aspects = dataset.catalogs.aspects.map((aspect) => {
    const value = network.dimensions[aspect.id];
    if (!value) return null;
    return dataset.catalogs.aspectCatalogs[aspect.id]?.[value]?.label ?? value;
  });
  return [source, measure, statistic, ...aspects].filter(Boolean).join(" / ");
};
