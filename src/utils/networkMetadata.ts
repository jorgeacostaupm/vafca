import type { Network, NetworkDataset, SourceKind } from "@/types/network";
import { networkMatrixSize } from "@/utils/networkData";

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
  ].join("::");

export const getNetworkSourceType = (
  network: Network,
  dataset?: Pick<NetworkDataset, "catalogs"> | null,
) => getNetworkSourceKind(network, dataset);

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

export const formatNetworkDataSize = (network: Network) => {
  if (network.data.format === "matrix") {
    const size = networkMatrixSize(network.data);
    return `${size} x ${size}`;
  }
  return `${network.nodeIds.length} nodes / ${network.data.edges.length} edges`;
};
