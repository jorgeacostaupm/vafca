import type { Catalogs, Network } from "@/types/network";

export const formatNetworkSourceLabel = (
  network: Network,
  catalogs?: Catalogs,
) => {
  if (network.derivation?.type === "aggregation") {
    return `Aggregated from ${network.derivation.baseNetworkId}`;
  }
  return catalogs?.sources[network.sourceId]?.label ?? network.sourceId;
};

export const formatNetworkSourceTypeLabel = (
  network: Network,
  catalogs?: Catalogs,
) => {
  if (network.derivation?.type === "aggregation") return "Aggregated";
  const kind = catalogs?.sources[network.sourceId]?.kind ?? "population";
  if (kind === "population") return "Population";
  if (kind === "subject") return "Subject";
  return "Comparison";
};

export const formatNetworkFilterOptionLabel = (
  network: Network,
  catalogs?: Catalogs,
) => {
  const source = formatNetworkSourceLabel(network, catalogs);
  const measure = catalogs?.measures[network.measureId]?.label ?? network.measureId;
  const statistic =
    catalogs?.statistics[network.statisticId]?.label ?? network.statisticId;
  const aspects =
    catalogs?.aspects
      .map((aspect) => {
        const valueId = network.dimensions[aspect.id];
        if (!valueId) return null;
        return catalogs.aspectCatalogs[aspect.id]?.[valueId]?.label ?? valueId;
      })
      .filter(Boolean)
      .join(" · ") ?? "";
  return network.label ?? [source, measure, statistic, aspects].filter(Boolean).join(" · ");
};
