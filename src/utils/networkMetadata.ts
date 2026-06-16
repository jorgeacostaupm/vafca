import type {
  ComparisonSide,
  Network,
  NetworkDataset,
  NetworkSource,
} from "@/types/network";
import { networkMatrixSize } from "@/utils/networkData";

export const getNetworkPopulationIds = (network: Network): string[] => {
  if (network.source.type === "population") return [network.source.populationId];
  if (network.source.type === "subject") return [];

  return [network.source.left, network.source.right].flatMap((side) =>
    side.type === "population" ? [side.populationId] : [],
  );
};

const formatComparisonSide = (
  side: ComparisonSide,
  dataset: NetworkDataset,
) => {
  if (side.label) return side.label;
  if (side.type === "subject") {
    return dataset.catalogs.subjects[side.subjectId]?.label ?? side.subjectId;
  }
  return (
    dataset.catalogs.populations[side.populationId]?.label ?? side.populationId
  );
};

export const formatNetworkSourceLabel = (
  network: Network,
  dataset: NetworkDataset,
) => {
  if (network.source.type === "subject") {
    return (
      dataset.catalogs.subjects[network.source.subjectId]?.label ??
      network.source.subjectId
    );
  }

  if (network.source.type === "population") {
    return (
      dataset.catalogs.populations[network.source.populationId]?.label ??
      network.source.populationId
    );
  }

  return `${formatComparisonSide(network.source.left, dataset)} vs ${formatComparisonSide(
    network.source.right,
    dataset,
  )}`;
};

export const createNetworkCompoundId = (network: Network) =>
  [
    network.context.layerId ?? "none",
    network.measureId,
    network.statisticId,
    getNetworkPopulationIds(network).sort().join("+") || network.id,
  ].join("::");

export const getNetworkSourceType = (network: Network): NetworkSource["type"] =>
  network.source.type;

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
  const layerId = network.context.layerId ?? "none";
  const layer = dataset.catalogs.layers[layerId]?.label ?? layerId;
  return [source, measure, layer, statistic].filter(Boolean).join(" / ");
};

export const formatNetworkDataSize = (network: Network) => {
  if (network.data.format === "matrix") {
    const size = networkMatrixSize(network.data);
    return `${size} x ${size}`;
  }
  return `${network.nodeIds.length} nodes / ${network.data.edges.length} edges`;
};
