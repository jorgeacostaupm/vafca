import { RANKING_TOP_N_OPTIONS } from "@/config/ui";
import type { ConnectivityDataState, ConnectivityMatrix } from "@/types/connectivityBundle";
import type { RankingQuery } from "@/types/rankings";
import {
  ALL_COMPATIBLE_LAYERS,
  getMatrixAggregationGroupingKey,
  getMatrixAggregationGroupingLabel,
  getMatrixLabel,
  getMatrixSource,
  getMatrixSourceLabel,
  matrixMatchesRankingQuery,
} from "@/utils/rankings/rankingMatrixMetadata";

type Option = { value: string; label: string };

const isRankingMatrixCandidate = (matrix: ConnectivityMatrix) => {
  void matrix;
  return true;
};

const sourceTypeLabel: Record<NonNullable<RankingQuery["sourceType"]>, string> = {
  population: "Population",
  subject: "Subject",
  comparison: "Comparison",
};

const matrixKindLabel: Record<ConnectivityMatrix["kind"], string> = {
  population: "Population",
  subject: "Subject",
  comparison: "Comparison",
  aggregated: "Aggregated",
};

const matchesQueryPart = (
  matrix: ConnectivityMatrix,
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
  return isRankingMatrixCandidate(matrix) && matrixMatchesRankingQuery(matrix, patch);
};

const getSelectedLayerCompatibility = (
  matrices: ConnectivityMatrix[],
  query: RankingQuery,
) => {
  const selectedLayerIds = (query.layerIds ?? []).filter(
    (layerId) => layerId !== ALL_COMPATIBLE_LAYERS,
  );
  if (selectedLayerIds.length === 0) return {};

  const selectedMatrices = matrices.filter(
    (matrix) =>
      selectedLayerIds.includes(matrix.context.layerId ?? "none") &&
      matchesQueryPart(matrix, query, ["layerIds"]),
  );
  const selectedKinds = new Set(
    selectedMatrices.map((matrix) => matrix.kind),
  );
  const selectedGroupingKeys = new Set(
    selectedMatrices
      .map(getMatrixAggregationGroupingKey)
      .filter((key): key is string => Boolean(key)),
  );

  return {
    matrixKind: selectedKinds.size === 1 ? Array.from(selectedKinds)[0] : undefined,
    aggregationGroupingKey:
      selectedGroupingKeys.size === 1
        ? Array.from(selectedGroupingKeys)[0]
        : undefined,
  };
};

export const getRankingLayerSelectionPatch = (
  connectivity: ConnectivityDataState | null | undefined,
  query: RankingQuery,
  layerIds: string[],
): Partial<RankingQuery> => {
  if (!connectivity || layerIds.includes(ALL_COMPATIBLE_LAYERS)) {
    return layerIds.includes(ALL_COMPATIBLE_LAYERS) && query.aggregationGroupingKey
      ? {
          matrixKind: query.matrixKind,
          aggregationGroupingKey: query.aggregationGroupingKey,
        }
      : {
          matrixKind: undefined,
          aggregationGroupingKey: undefined,
        };
  }

  const compatibility = getSelectedLayerCompatibility(connectivity.matrices, {
    ...query,
    layerIds,
  });
  return {
    matrixKind: compatibility.matrixKind,
    aggregationGroupingKey: compatibility.aggregationGroupingKey,
  };
};

export const matrixMetricOptions = [
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

export const roiMetricOptions = [
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
  connectivity?: ConnectivityDataState | null,
  query: RankingQuery = {} as RankingQuery,
) => {
  if (!connectivity) return [];
  const seen = new Set<string>();
  const options = connectivity.matrices.flatMap((matrix) => {
    if (!matchesQueryPart(matrix, query, ["sourceType", "sourceId"])) {
      return [];
    }
    const source = getMatrixSource(matrix);
    if (!source.sourceType || !source.sourceId) return [];
    const value = `${source.sourceType}::${source.sourceId}`;
    if (seen.has(value)) return [];
    seen.add(value);
    return [
      {
        label: `${sourceTypeLabel[source.sourceType]} · ${
          getMatrixSourceLabel(matrix, connectivity) ?? source.sourceId
        }`,
        value,
      },
    ];
  });
  return options;
};

export const getMeasureOptions = (
  connectivity: ConnectivityDataState | null | undefined,
  query: RankingQuery,
): Option[] => {
  if (!connectivity) return [];
  const options = Array.from(
    new Set(
      connectivity.matrices
        .filter((matrix) => matchesQueryPart(matrix, query, ["measureId"]))
        .map((matrix) => matrix.context.measureId),
    ),
  )
    .sort()
    .map((id) => ({
      label: connectivity.catalogs.measures[id]?.label ?? id,
      value: id,
    }));
  return options;
};

export const getStatisticOptions = (
  connectivity: ConnectivityDataState | null | undefined,
  query: RankingQuery,
): Option[] => {
  if (!connectivity) return [];
  const options = Array.from(
    new Set(
      connectivity.matrices
        .filter((matrix) => matchesQueryPart(matrix, query, ["statisticId"]))
        .map((matrix) => matrix.stat.id),
    ),
  )
    .sort()
    .map((id) => ({
      label: connectivity.catalogs.stats[id]?.label ?? id,
      value: id,
    }));
  return options;
};

export const getCompatibleLayerOptions = (
  connectivity: ConnectivityDataState | null | undefined,
  query: RankingQuery,
) => {
  if (!connectivity) return [];
  const selectedCompatibility = getSelectedLayerCompatibility(
    connectivity.matrices,
    query,
  );
  const layers = connectivity.matrices
    .filter((matrix) => {
      if (!matchesQueryPart(matrix, query, ["layerIds", "aggregationGroupingKey"])) {
        return false;
      }
      if (
        selectedCompatibility.matrixKind &&
        matrix.kind !== selectedCompatibility.matrixKind
      ) {
        return false;
      }
      if (
        selectedCompatibility.aggregationGroupingKey &&
        getMatrixAggregationGroupingKey(matrix) !==
          selectedCompatibility.aggregationGroupingKey
      ) {
        return false;
      }
      return true;
    });
  const uniqueLayers = Array.from(
    new Map(
      layers.map((matrix) => {
        const layerId = matrix.context.layerId ?? "none";
        const groupingLabel = getMatrixAggregationGroupingLabel(matrix);
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
        connectivity.catalogs.layers[layerId]?.label ?? layerId,
        groupingLabel ? `grouped by ${groupingLabel}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      value: layerId,
    })),
  ];
};

export const getMatrixOptions = (
  connectivity: ConnectivityDataState | null | undefined,
  query?: RankingQuery,
) => {
  if (!connectivity) return [];
  return connectivity.matrices
    .filter((matrix) =>
      query
        ? isRankingMatrixCandidate(matrix) && matrixMatchesRankingQuery(matrix, query)
        : isRankingMatrixCandidate(matrix),
    )
    .map((matrix) => ({
      label: `${getMatrixLabel(matrix, connectivity)} · ${matrixKindLabel[matrix.kind]}`,
      value: matrix.id,
      matrix,
    }));
};

export const findMatrix = (
  connectivity: ConnectivityDataState | null | undefined,
  matrixId?: string,
): ConnectivityMatrix | undefined =>
  matrixId && connectivity ? connectivity.matrixIndex[matrixId] : undefined;

export const getRankingQueryMissingFields = (
  query: RankingQuery,
  connectivity?: ConnectivityDataState | null,
) => {
  const missing: string[] = [];
  if (!connectivity) missing.push("dataset");
  if (!query.target) missing.push("target");
  if (!query.sourceType || !query.sourceId) missing.push("source");
  if (!query.measureId) missing.push("measure");
  if (!query.statisticId) missing.push("statistic");
  if (!query.metric) missing.push("metric");
  if (!query.topN) missing.push("top N");
  const hasSelectedLayers = Boolean(query.layerIds?.length);
  if (!hasSelectedLayers) missing.push("layers");
  if (
    query.target === "rois" &&
    (!hasSelectedLayers ||
      query.layerIds?.length !== 1 ||
      query.layerIds.includes(ALL_COMPATIBLE_LAYERS))
  ) {
    missing.push("single layer");
  }
  if (
    connectivity &&
    query.sourceType &&
    query.sourceId &&
    query.measureId &&
    query.statisticId &&
    hasSelectedLayers &&
    !connectivity.matrices.some((matrix) => matchesQueryPart(matrix, query))
  ) {
    missing.push("compatible matrices");
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
  if (target === "matrices") return "Networks";
  if (target === "rois") return "ROIs";
  return "Links";
};

const optionLabel = (options: Option[], value?: string) =>
  value ? options.find((option) => option.value === value)?.label ?? value : undefined;

export const getRankingMetricLabel = (query: RankingQuery) => {
  const options =
    query.target === "matrices"
      ? matrixMetricOptions
      : query.target === "links"
        ? linkMetricOptions
        : roiMetricOptions;
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
    query.target === "rois" &&
    query.allowRoiRankingAutoconnections
  ) {
    return "autoconnections allowed";
  }
  return undefined;
};

export const formatRankingPanelTitle = (
  result: { query: RankingQuery },
  connectivity?: ConnectivityDataState | null,
) => {
  const query = result.query;
  const source =
    connectivity && query.sourceType && query.sourceId
      ? optionLabel(getSourceOptions(connectivity, query), `${query.sourceType}::${query.sourceId}`)
      : "all sources";
  const measure =
    connectivity && query.measureId
      ? connectivity.catalogs.measures[query.measureId]?.label ?? query.measureId
      : "all measures";
  const statistic =
    connectivity && query.statisticId
      ? connectivity.catalogs.stats[query.statisticId]?.label ?? query.statisticId
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
