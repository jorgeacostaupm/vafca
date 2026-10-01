import type { Network, NetworkDataset } from "@/types/network";
import type { RankingNetworkKind, RankingQuery } from "@/types/rankings";
import { createNetworkCompoundId, formatNetworkLabel, formatNetworkSourceLabel, getNetworkSourceKind } from "@/utils/networkMetadata";
export { areRankingSourcesCompatible } from "@/utils/rankings/rankingSourceCompatibility";
import { areRankingSourcesCompatible } from "@/utils/rankings/rankingSourceCompatibility";

export const ALL_COMPATIBLE_ASPECT_VALUES = "__all_compatible__";

export const getRankingQuerySourceIds = (query: RankingQuery) =>
  query.sourceIds?.length ? query.sourceIds : query.sourceId ? [query.sourceId] : [];

export const getRankingNetworkKind = (
  network: Network,
  dataset: NetworkDataset,
): RankingNetworkKind =>
  network.derivation?.type === "aggregation"
    ? "aggregation"
    : getNetworkSourceKind(network, dataset);

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

export const getNetworkSourceLabel = (
  network: Network,
  dataset: NetworkDataset,
) => formatNetworkSourceLabel(network, dataset);

export const getNetworkCompoundId = createNetworkCompoundId;

export const getNetworkLabel = (
  network: Network,
  dataset: NetworkDataset,
) => formatNetworkLabel(network, dataset);

export const getNetworkEndpointIds = (network: Network): string[] =>
  network.nodeIds;

export const resolveNetworkEndpointIds = (network: Network): string[] =>
  getNetworkEndpointIds(network);

const aspectMatches = (
  network: Network,
  aspectFilters: RankingQuery["aspectFilters"],
) => {
  if (!aspectFilters) return true;
  return Object.entries(aspectFilters).every(([aspectId, values]) => {
    if (values.length === 0 || values.includes(ALL_COMPATIBLE_ASPECT_VALUES)) {
      return true;
    }
    return values.includes(network.dimensions[aspectId]);
  });
};

export const networkMatchesRankingQuery = (
  network: Network,
  query: RankingQuery,
  dataset: NetworkDataset,
) => {
  const sourceIds = getRankingQuerySourceIds(query);
  const aggregationGroupingKey = getNetworkAggregationGroupingKey(network);
  const networkKind = getRankingNetworkKind(network, dataset);

  return (
    (sourceIds.length === 0 || sourceIds.includes(network.sourceId)) &&
    (!query.networkKind || networkKind === query.networkKind) &&
    (!query.aggregationGroupingKey ||
      aggregationGroupingKey === query.aggregationGroupingKey) &&
    (!query.measureId || network.measureId === query.measureId) &&
    (!query.statisticId || network.statisticId === query.statisticId) &&
    aspectMatches(network, query.aspectFilters)
  );
};

export const resolveRankingNetworkCollection = (
  dataset: NetworkDataset,
  query: RankingQuery,
) => {
  const sourceIds = getRankingQuerySourceIds(query);
  if (!areRankingSourcesCompatible(sourceIds, dataset)) return [];
  const directIds = query.networkIds?.length
    ? query.networkIds
    : query.networkId
      ? [query.networkId]
      : [];
  if (directIds.length > 0) {
    const directNetworks = directIds
      .map((id) => dataset.networkIndex[id])
      .filter((network): network is Network => Boolean(network));
    return areRankingSourcesCompatible(
      directNetworks.map((network) => network.sourceId),
      dataset,
    )
      ? directNetworks
      : [];
  }
  const matches = dataset.networks.filter((network) =>
    networkMatchesRankingQuery(network, query, dataset),
  );
  const first = matches[0];
  if (!first) return [];
  const firstEndpointKey = JSON.stringify(resolveNetworkEndpointIds(first));
  return matches.filter(
    (network) =>
      (network.derivation?.type === "aggregation") ===
        (first.derivation?.type === "aggregation") &&
      getNetworkAggregationGroupingKey(network) ===
        getNetworkAggregationGroupingKey(first) &&
      network.nodeSetId === first.nodeSetId &&
      network.nodeIds.length === first.nodeIds.length &&
      JSON.stringify(resolveNetworkEndpointIds(network)) === firstEndpointKey,
  );
};
