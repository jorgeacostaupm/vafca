import type { Catalogs, Network } from "@/types/network";
import { formatPopulationSetLabel } from "@/utils/matrixViewUtils";
import { getNetworkPopulationIds } from "@/utils/networkMetadata";

export const formatNetworkSourceLabel = (
  network: Network,
  catalogs?: Catalogs,
) => {
  if (network.derivation?.type === "aggregation") {
    return `Aggregated from ${network.derivation.baseNetworkId}`;
  }
  if (network.source.type === "subject") {
    return catalogs?.subjects[network.source.subjectId]?.label ?? network.source.subjectId;
  }
  if (network.source.type === "population") {
    return catalogs?.populations[network.source.populationId]?.label ?? network.source.populationId;
  }
  const left =
    network.source.left.label ??
    (network.source.left.type === "population"
      ? catalogs?.populations[network.source.left.populationId]?.label ??
        network.source.left.populationId
      : catalogs?.subjects[network.source.left.subjectId]?.label ??
        network.source.left.subjectId) ??
    "Left";
  const right =
    network.source.right.label ??
    (network.source.right.type === "population"
      ? catalogs?.populations[network.source.right.populationId]?.label ??
        network.source.right.populationId
      : catalogs?.subjects[network.source.right.subjectId]?.label ??
        network.source.right.subjectId) ??
    "Right";
  return `${left} vs ${right}`;
};

export const formatNetworkSourceTypeLabel = (network: Network) => {
  if (network.derivation?.type === "aggregation") return "Aggregated";
  if (network.source.type === "population") return "Population";
  if (network.source.type === "subject") return "Subject";
  return "Comparison";
};

export const formatNetworkFilterOptionLabel = (
  network: Network,
  catalogs?: Catalogs,
) => {
  const source = formatNetworkSourceLabel(network, catalogs);
  const layer = network.context.layerId
    ? catalogs?.layers[network.context.layerId]?.label ?? network.context.layerId
    : "No layer";
  const measure = catalogs?.measures[network.measureId]?.label ?? network.measureId;
  const statistic =
    catalogs?.statistics[network.statisticId]?.label ?? network.statisticId;
  const populationLabel = formatPopulationSetLabel(
    getNetworkPopulationIds(network),
    catalogs,
  );
  return network.label ?? `${source} · ${populationLabel} · ${layer} · ${measure} · ${statistic}`;
};
