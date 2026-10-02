import type { NetworkDataset } from "@/types/network";
import type { RankingQuery } from "@/types/rankings";

import { areRankingSourcesCompatible, getRankingQuerySourceIds, networkMatchesRankingQuery } from "./rankingNetworkMetadata";

export const getRankingQueryMissingFields = (
  query: RankingQuery,
  dataset?: NetworkDataset | null,
) => {
  const missing: string[] = [];
  if (!dataset) missing.push("dataset");
  if (!query.target) missing.push("target");
  const sourceIds = getRankingQuerySourceIds(query);
  if (!sourceIds.length) missing.push("source");
  if (dataset && !areRankingSourcesCompatible(sourceIds, dataset)) {
    missing.push("compatible source types");
  }
  if (!query.measureId) missing.push("measure");
  if (!query.statisticId) missing.push("statistic");
  if (!query.metric) missing.push("metric");
  if (!query.topN) missing.push("top N");
  dataset?.catalogs.aspects.forEach((aspect) => {
    if (!(query.aspectFilters?.[aspect.id]?.length)) missing.push(aspect.label);
  });
  if (
    dataset &&
    sourceIds.length > 0 &&
    query.measureId &&
    query.statisticId &&
    dataset.catalogs.aspects.every((aspect) => query.aspectFilters?.[aspect.id]?.length) &&
    !sourceIds.every((sourceId) =>
      dataset.networks.some(
        (network) =>
          network.sourceId === sourceId &&
          networkMatchesRankingQuery(network, query, dataset),
      ),
    )
  ) {
    missing.push("compatible networks");
  }
  if (
    query.target === "links" &&
    Object.values(query.aspectFilters ?? {}).some((values) => values.length > 1) &&
    !query.linkCollectionMode
  ) {
    missing.push("multi-matrix mode");
  }
  return missing;
};

