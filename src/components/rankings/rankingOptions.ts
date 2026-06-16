import { RANKING_TOP_N_OPTIONS } from "@/config/ui";
import type { Network, NetworkDataset } from "@/types/network";
import type { RankingNetworkKind, RankingQuery } from "@/types/rankings";
import {
  ALL_COMPATIBLE_LAYERS,
  getNetworkAggregationGroupingKey,
  getNetworkAggregationGroupingLabel,
  getNetworkSource,
  getNetworkSourceLabel,
  getRankingNetworkKind,
  networkMatchesRankingQuery,
} from "@/utils/rankings/rankingNetworkMetadata";

type Option = { value: string; label: string };

const isRankingNetworkCandidate = (network: Network) => {
  void network;
  return true;
};

const sourceTypeLabel: Record<NonNullable<RankingQuery["sourceType"]>, string> = {
  population: "Population",
  subject: "Subject",
  comparison: "Comparison",
};

const matchesQueryPart = (
  network: Network,
  query: RankingQuery,
  ignored: Array<keyof RankingQuery> = [],
) => {
  const patch = { ...query };
  ignored.forEach((key) => {
    delete patch[key];
  });
  if (patch.layerIds?.length === 0) {
    delete patch.layerIds;
  }
  return isRankingNetworkCandidate(network) && networkMatchesRankingQuery(network, patch);
};

const getSelectedLayerCompatibility = (
  networks: Network[],
  query: RankingQuery,
) => {
  const selectedLayerIds = (query.layerIds ?? []).filter(
    (layerId) => layerId !== ALL_COMPATIBLE_LAYERS,
  );
  if (selectedLayerIds.length === 0) return {};

  const selectedNetworks = networks.filter(
    (network) =>
      selectedLayerIds.includes(network.context.layerId ?? "none") &&
      matchesQueryPart(network, query, ["layerIds"]),
  );
  const selectedKinds = new Set<RankingNetworkKind>(
    selectedNetworks.map(getRankingNetworkKind),
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

export const getRankingLayerSelectionPatch = (
  dataset: NetworkDataset | null | undefined,
  query: RankingQuery,
  layerIds: string[],
): Partial<RankingQuery> => {
  if (!dataset || layerIds.includes(ALL_COMPATIBLE_LAYERS)) {
    return layerIds.includes(ALL_COMPATIBLE_LAYERS) && query.aggregationGroupingKey
      ? {
          networkKind: query.networkKind,
          aggregationGroupingKey: query.aggregationGroupingKey,
        }
      : {
          networkKind: undefined,
          aggregationGroupingKey: undefined,
        };
  }

  const compatibility = getSelectedLayerCompatibility(dataset.networks, {
    ...query,
    layerIds,
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
  { label: "Mean across layers", value: "meanAcrossMatrices" },
  { label: "Mean absolute across layers", value: "meanAbsAcrossMatrices" },
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

export const getSourceOptions = (
  dataset?: NetworkDataset | null,
  query: RankingQuery = {} as RankingQuery,
) => {
  if (!dataset) return [];
  const seen = new Set<string>();
  const options = dataset.networks.flatMap((network) => {
    if (!matchesQueryPart(network, query, ["sourceType", "sourceId"])) {
      return [];
    }
    const source = getNetworkSource(network);
    if (!source.sourceType || !source.sourceId) return [];
    const value = `${source.sourceType}::${source.sourceId}`;
    if (seen.has(value)) return [];
    seen.add(value);
    return [
      {
        label: `${sourceTypeLabel[source.sourceType]} · ${
          getNetworkSourceLabel(network, dataset) ?? source.sourceId
        }`,
        value,
      },
    ];
  });
  return options;
};

export const getMeasureOptions = (
  dataset: NetworkDataset | null | undefined,
  query: RankingQuery,
): Option[] => {
  if (!dataset) return [];
  const options = Array.from(
    new Set(
      dataset.networks
        .filter((network) => matchesQueryPart(network, query, ["measureId"]))
        .map((network) => network.measureId),
    ),
  )
    .sort()
    .map((id) => ({
      label: dataset.catalogs.measures[id]?.label ?? id,
      value: id,
    }));
  return options;
};

export const getStatisticOptions = (
  dataset: NetworkDataset | null | undefined,
  query: RankingQuery,
): Option[] => {
  if (!dataset) return [];
  const options = Array.from(
    new Set(
      dataset.networks
        .filter((network) => matchesQueryPart(network, query, ["statisticId"]))
        .map((network) => network.statisticId),
    ),
  )
    .sort()
    .map((id) => ({
      label: dataset.catalogs.statistics[id]?.label ?? id,
      value: id,
    }));
  return options;
};

export const getCompatibleLayerOptions = (
  dataset: NetworkDataset | null | undefined,
  query: RankingQuery,
) => {
  if (!dataset) return [];
  const selectedCompatibility = getSelectedLayerCompatibility(
    dataset.networks,
    query,
  );
  const layers = dataset.networks
    .filter((network) => {
      if (!matchesQueryPart(network, query, ["layerIds", "aggregationGroupingKey"])) {
        return false;
      }
      if (
        selectedCompatibility.networkKind &&
        getRankingNetworkKind(network) !== selectedCompatibility.networkKind
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
  const uniqueLayers = Array.from(
    new Map(
      layers.map((network) => {
        const layerId = network.context.layerId ?? "none";
        const groupingLabel = getNetworkAggregationGroupingLabel(network);
        return [
          layerId,
          {
            layerId,
            groupingLabel,
          },
        ];
      }),
    ).values(),
  );
  return [
    { label: "All layers", value: ALL_COMPATIBLE_LAYERS },
    ...uniqueLayers.map(({ layerId, groupingLabel }) => ({
      label: [
        dataset.catalogs.layers[layerId]?.label ?? layerId,
        groupingLabel ? `grouped by ${groupingLabel}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      value: layerId,
    })),
  ];
};

export const getRankingQueryMissingFields = (
  query: RankingQuery,
  dataset?: NetworkDataset | null,
) => {
  const missing: string[] = [];
  if (!dataset) missing.push("dataset");
  if (!query.target) missing.push("target");
  if (!query.sourceType || !query.sourceId) missing.push("source");
  if (!query.measureId) missing.push("measure");
  if (!query.statisticId) missing.push("statistic");
  if (!query.metric) missing.push("metric");
  if (!query.topN) missing.push("top N");
  const hasSelectedLayers = Boolean(query.layerIds?.length);
  if (!hasSelectedLayers) missing.push("layers");
  if (
    query.target === "nodes" &&
    (!hasSelectedLayers ||
      query.layerIds?.length !== 1 ||
      query.layerIds.includes(ALL_COMPATIBLE_LAYERS))
  ) {
    missing.push("single layer");
  }
  if (
    dataset &&
    query.sourceType &&
    query.sourceId &&
    query.measureId &&
    query.statisticId &&
    hasSelectedLayers &&
    !dataset.networks.some((network) => matchesQueryPart(network, query))
  ) {
    missing.push("compatible networks");
  }
  if (
    query.target === "links" &&
    query.layerIds &&
    query.layerIds.length !== 1 &&
    !query.linkCollectionMode
  ) {
    missing.push("multi-layer mode");
  }
  return missing;
};

const titleCaseTarget = (target: RankingQuery["target"]) => {
  if (target === "networks") return "Networks";
  if (target === "nodes") return "Nodes";
  return "Links";
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

const rankingAutoconnectionsLabel = (query: RankingQuery) => {
  if (
    query.target === "links" &&
    query.allowLinkRankingAutoconnections
  ) {
    return "autoconnections allowed";
  }
  if (
    query.target === "nodes" &&
    query.allowNodeRankingAutoconnections
  ) {
    return "autoconnections allowed";
  }
  return undefined;
};

export const formatRankingPanelTitle = (
  result: { query: RankingQuery },
  dataset?: NetworkDataset | null,
) => {
  const query = result.query;
  const source =
    dataset && query.sourceType && query.sourceId
      ? optionLabel(getSourceOptions(dataset, query), `${query.sourceType}::${query.sourceId}`)
      : "all sources";
  const measure =
    dataset && query.measureId
      ? dataset.catalogs.measures[query.measureId]?.label ?? query.measureId
      : "all measures";
  const statistic =
    dataset && query.statisticId
      ? dataset.catalogs.statistics[query.statisticId]?.label ?? query.statisticId
      : "all statistics";
  const autoconnections = rankingAutoconnectionsLabel(query);

  return [
    titleCaseTarget(query.target),
    source,
    measure,
    statistic,
    autoconnections,
  ]
    .filter(Boolean)
    .join(" · ");
};
