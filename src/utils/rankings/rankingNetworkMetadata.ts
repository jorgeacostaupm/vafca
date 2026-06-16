import type { Network, NetworkDataset } from "@/types/network";
import type { RankingQuery } from "@/types/rankings";
import { createNetworkCompoundId, formatNetworkLabel, formatNetworkSourceLabel, getNetworkPopulationIds } from "@/utils/networkMetadata";

export const ALL_COMPATIBLE_LAYERS = "__all_compatible_layers__";

export const getRankingNetworkKind = (network: Network) =>
  network.derivation?.type === "aggregation" ? "aggregation" : network.source.type;

export const getNetworkAggregationGroupingKey = (network: Network) => {
  if (network.derivation?.type !== "aggregation") return undefined;
  const parameters = network.derivation.parameters;
  return [
    network.derivation.sourceNodeSetId,
    `${network.nodeIds.length}x${network.nodeIds.length}`,
    network.derivation.fields.join("/"),
    parameters.missingNodePolicy,
    parameters.activeNodeSetHash,
    parameters.groupOrderHash ?? "unordered",
  ].join("::");
};

export const getNetworkAggregationGroupingLabel = (network: Network) => {
  if (network.derivation?.type !== "aggregation") return undefined;
  return network.derivation.fields.join(" / ");
};

export const getNetworkSource = (
  network: Network,
): { sourceType?: RankingQuery["sourceType"]; sourceId?: string } => {
  if (network.source.type === "population") {
    return {
      sourceType: "population",
      sourceId: network.source.populationId,
    };
  }
  if (network.source.type === "subject") {
    return { sourceType: "subject", sourceId: network.source.subjectId };
  }
  if (network.source.type === "comparison") {
    const left =
      network.source.left.label ??
      (network.source.left.type === "population"
        ? network.source.left.populationId
        : network.source.left.subjectId) ??
      "left";
    const right =
      network.source.right.label ??
      (network.source.right.type === "population"
        ? network.source.right.populationId
        : network.source.right.subjectId) ??
      "right";
    return { sourceType: "comparison", sourceId: `${left} vs ${right}` };
  }
  return {};
};

export const getNetworkSourceLabel = (
  network: Network,
  dataset: NetworkDataset,
) => {
  if (network.derivation?.type === "aggregation") {
    const populationIds = getNetworkPopulationIds(network);
    if (populationIds.length > 0) {
      return populationIds
        .map((id) => dataset.catalogs.populations[id]?.label ?? id)
        .join(" + ");
    }
  }
  return formatNetworkSourceLabel(network, dataset);
};

export const getNetworkCompoundId = createNetworkCompoundId;

export const getNetworkLabel = (
  network: Network,
  dataset: NetworkDataset,
) => formatNetworkLabel(network, dataset);

export const getNetworkEndpointIds = (network: Network): string[] =>
  network.nodeIds;

export const resolveNetworkEndpointIds = (network: Network): string[] =>
  getNetworkEndpointIds(network);

export const networkMatchesRankingQuery = (
  network: Network,
  query: RankingQuery,
) => {
  const source = getNetworkSource(network);
  const layerId = network.context.layerId ?? "none";
  const layerIds = query.layerIds ?? [];
  const usesAllLayers =
    query.layerIds === undefined || layerIds.includes(ALL_COMPATIBLE_LAYERS);
  const aggregationGroupingKey = getNetworkAggregationGroupingKey(network);
  const networkKind = getRankingNetworkKind(network);

  return (
    (!query.sourceType || source.sourceType === query.sourceType) &&
    (!query.sourceId || source.sourceId === query.sourceId) &&
    (!query.networkKind || networkKind === query.networkKind) &&
    (!query.aggregationGroupingKey ||
      aggregationGroupingKey === query.aggregationGroupingKey) &&
    (!query.measureId || network.measureId === query.measureId) &&
    (!query.statisticId || network.statisticId === query.statisticId) &&
    (usesAllLayers || layerIds.includes(layerId))
  );
};

export const resolveRankingNetworkCollection = (
  dataset: NetworkDataset,
  query: RankingQuery,
) => {
  const directIds = query.networkIds?.length
    ? query.networkIds
    : query.networkId
      ? [query.networkId]
      : [];
  if (directIds.length > 0) {
    return directIds
      .map((id) => dataset.networkIndex[id])
      .filter((network): network is Network => Boolean(network));
  }
  const matches = dataset.networks.filter((network) =>
    networkMatchesRankingQuery(network, query),
  );
  const first = matches[0];
  if (!first) return [];
  const firstEndpointKey = JSON.stringify(resolveNetworkEndpointIds(first));
  return matches.filter(
    (network) =>
      getRankingNetworkKind(network) === getRankingNetworkKind(first) &&
      getNetworkAggregationGroupingKey(network) ===
        getNetworkAggregationGroupingKey(first) &&
      network.nodeSetId === first.nodeSetId &&
      network.nodeIds.length === first.nodeIds.length &&
      JSON.stringify(resolveNetworkEndpointIds(network)) === firstEndpointKey,
  );
};
