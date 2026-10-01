import { RANKING_TOP_N_OPTIONS } from "@/config/ui";
import type { Network, NetworkDataset } from "@/types/network";
import type { RankingNetworkKind, RankingQuery } from "@/types/rankings";
import {
  ALL_COMPATIBLE_ASPECT_VALUES,
  areRankingSourcesCompatible,
  getNetworkAggregationGroupingKey,
  getRankingNetworkKind,
  getRankingQuerySourceIds,
  networkMatchesRankingQuery,
} from "@/utils/rankings/rankingNetworkMetadata";

type Option = { value: string; label: string; disabled?: boolean };

export type RankingAspectOptions = {
  id: string;
  label: string;
  options: Option[];
};

const isRankingNetworkCandidate = (network: Network) => {
  void network;
  return true;
};

const matchesQueryPart = (
  network: Network,
  dataset: NetworkDataset,
  query: RankingQuery,
  ignored: Array<keyof RankingQuery> = [],
) => {
  const patch = { ...query };
  ignored.forEach((key) => {
    delete patch[key];
  });
  return isRankingNetworkCandidate(network) && networkMatchesRankingQuery(network, patch, dataset);
};

const getSelectedAspectCompatibility = (
  networks: Network[],
  dataset: NetworkDataset,
  query: RankingQuery,
) => {
  const hasSpecificAspectFilter = Object.values(query.aspectFilters ?? {}).some(
    (values) => values.length > 0 && !values.includes(ALL_COMPATIBLE_ASPECT_VALUES),
  );
  if (!hasSpecificAspectFilter) return {};

  const selectedNetworks = networks.filter((network) =>
    matchesQueryPart(network, dataset, query, ["aspectFilters"]),
  );
  const selectedKinds = new Set<RankingNetworkKind>(
    selectedNetworks.map((network) => getRankingNetworkKind(network, dataset)),
  );
  const selectedGroupingKeys = new Set(
    selectedNetworks
      .map(getNetworkAggregationGroupingKey)
      .filter((key): key is string => Boolean(key)),
  );

  return {
    networkKind: selectedKinds.size === 1 ? Array.from(selectedKinds)[0] : undefined,
    aggregationGroupingKey:
      selectedGroupingKeys.size === 1
        ? Array.from(selectedGroupingKeys)[0]
        : undefined,
  };
};

export const getRankingAspectSelectionPatch = (
  dataset: NetworkDataset | null | undefined,
  query: RankingQuery,
  aspectFilters: Record<string, string[]>,
): Partial<RankingQuery> => {
  if (!dataset) {
    return {
      networkKind: undefined,
      aggregationGroupingKey: undefined,
    };
  }

  const compatibility = getSelectedAspectCompatibility(dataset.networks, dataset, {
    ...query,
    aspectFilters,
  });
  return {
    networkKind: compatibility.networkKind,
    aggregationGroupingKey: compatibility.aggregationGroupingKey,
  };
};

export const networkMetricOptions = [
  { label: "Mean value", value: "meanValue" },
  { label: "Mean absolute value", value: "meanAbsValue" },
  { label: "Median value", value: "medianValue" },
  { label: "Max value", value: "maxValue" },
  { label: "Max absolute value", value: "maxAbsValue" },
];

export const linkMetricOptions = [
  { label: "Highest value", value: "highestValue" },
  { label: "Lowest value", value: "lowestValue" },
  { label: "Highest absolute value", value: "highestAbsValue" },
  { label: "Mean across matrices", value: "meanAcrossMatrices" },
  { label: "Mean absolute across matrices", value: "meanAbsAcrossMatrices" },
];

export const nodeMetricOptions = [
  { label: "Mean incident value", value: "meanValue" },
  { label: "Mean absolute incident value", value: "meanAbsValue" },
  { label: "Max incident value", value: "maxValue" },
  { label: "Max absolute incident value", value: "maxAbsValue" },
];

export const topNOptions = RANKING_TOP_N_OPTIONS.map((value) => ({
  label: String(value),
  value,
}));

const uniqueOptions = (
  ids: Iterable<string>,
  labelForId: (id: string) => string,
): Option[] =>
  Array.from(new Set(ids))
    .map((id) => ({ value: id, label: labelForId(id) }))
    .sort((a, b) => a.label.localeCompare(b.label));

export const getSourceOptions = (
  dataset?: NetworkDataset | null,
  query: RankingQuery = {} as RankingQuery,
) => {
  if (!dataset) return [];
  const selectedSourceIds = getRankingQuerySourceIds(query);
  const selectedIsComparison = selectedSourceIds.length
    ? dataset.catalogs.sources[selectedSourceIds[0]]?.kind === "comparison"
    : undefined;
  return uniqueOptions(
    dataset.networks
      .filter((network) =>
        matchesQueryPart(network, dataset, query, ["sourceId", "sourceIds"]),
      )
      .map((network) => network.sourceId),
    (id) => dataset.catalogs.sources[id]?.label ?? id,
  ).map((option) => ({
    ...option,
    disabled:
      selectedIsComparison !== undefined &&
      (dataset.catalogs.sources[option.value]?.kind === "comparison") !==
        selectedIsComparison,
  }));
};

const sharedIdsAcrossSelectedSources = (
  networks: Network[],
  sourceIds: string[],
  getId: (network: Network) => string,
) => {
  if (sourceIds.length < 2) return networks.map(getId);
  const sourcesById = new Map<string, Set<string>>();
  networks.forEach((network) => {
    const sources = sourcesById.get(getId(network)) ?? new Set<string>();
    sources.add(network.sourceId);
    sourcesById.set(getId(network), sources);
  });
  return Array.from(sourcesById.entries())
    .filter(([, sources]) => sourceIds.every((sourceId) => sources.has(sourceId)))
    .map(([id]) => id);
};

export const getMeasureOptions = (
  dataset: NetworkDataset | null | undefined,
  query: RankingQuery,
): Option[] => {
  if (!dataset) return [];
  const networks = dataset.networks.filter((network) =>
    matchesQueryPart(network, dataset, query, ["measureId"]),
  );
  return uniqueOptions(
    sharedIdsAcrossSelectedSources(
      networks,
      getRankingQuerySourceIds(query),
      (network) => network.measureId,
    ),
    (id) => dataset.catalogs.measures[id]?.label ?? id,
  );
};

export const getStatisticOptions = (
  dataset: NetworkDataset | null | undefined,
  query: RankingQuery,
): Option[] => {
  if (!dataset) return [];
  const networks = dataset.networks.filter((network) =>
    matchesQueryPart(network, dataset, query, ["statisticId"]),
  );
  return uniqueOptions(
    sharedIdsAcrossSelectedSources(
      networks,
      getRankingQuerySourceIds(query),
      (network) => network.statisticId,
    ),
    (id) => dataset.catalogs.statistics[id]?.label ?? id,
  );
};

export const getRankingAspectOptions = (
  dataset: NetworkDataset | null | undefined,
  query: RankingQuery,
): RankingAspectOptions[] => {
  if (!dataset) return [];
  const selectedCompatibility = getSelectedAspectCompatibility(
    dataset.networks,
    dataset,
    query,
  );
  return dataset.catalogs.aspects.map((aspect) => {
    const networks = dataset.networks.filter((network) => {
        if (!matchesQueryPart(network, dataset, query, ["aspectFilters", "aggregationGroupingKey"])) {
          return false;
        }
        if (
          selectedCompatibility.networkKind &&
          getRankingNetworkKind(network, dataset) !== selectedCompatibility.networkKind
        ) {
          return false;
        }
        if (
          selectedCompatibility.aggregationGroupingKey &&
          getNetworkAggregationGroupingKey(network) !==
            selectedCompatibility.aggregationGroupingKey
        ) {
          return false;
        }
        return true;
      });
    const values = sharedIdsAcrossSelectedSources(
      networks,
      getRankingQuerySourceIds(query),
      (network) => network.dimensions[aspect.id],
    )
      .filter((value): value is string => Boolean(value));

    return {
      id: aspect.id,
      label: aspect.label,
      options: [
        { label: "All compatible", value: ALL_COMPATIBLE_ASPECT_VALUES },
        ...uniqueOptions(
          values,
          (id) => dataset.catalogs.aspectCatalogs[aspect.id]?.[id]?.label ?? id,
        ),
      ],
    };
  });
};

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
          matchesQueryPart(network, dataset, query),
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

const titleCaseTarget = (target: RankingQuery["target"]) => {
  if (target === "networks") return "Network";
  if (target === "nodes") return "Node";
  return "Link";
};

const optionLabel = (options: Option[], value?: string) =>
  value ? options.find((option) => option.value === value)?.label ?? value : undefined;

export const getRankingMetricLabel = (query: RankingQuery) => {
  const options =
    query.target === "networks"
      ? networkMetricOptions
      : query.target === "links"
        ? linkMetricOptions
        : nodeMetricOptions;
  return optionLabel(options, query.metric) ?? query.metric;
};

export const formatRankingPanelTitle = (
  { query }: { query: RankingQuery },
  dataset?: NetworkDataset | null,
) => [
  `${titleCaseTarget(query.target)} Ranking`,
  dataset?.catalogs.measures[query.measureId ?? ""]?.label ?? query.measureId,
].filter(Boolean).join(" · ");
