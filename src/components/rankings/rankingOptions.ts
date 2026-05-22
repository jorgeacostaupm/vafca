import {
  ALL_COMPATIBLE_BANDS,
  getMatrixLabel,
  getMatrixSource,
  getMatrixSourceLabel,
  matrixMatchesRankingQuery,
  toRankingMatrixKind,
} from "@/utils/rankings/rankingMatrixMetadata";
import type { ConnectivityDataState, MatrixRecord } from "@/types/connectivityBundle";
import type { RankingQuery } from "@/types/rankings";

type Option = { value: string; label: string };

export const ALL_RANKING_SOURCES = "__all_ranking_sources__";
export const ALL_RANKING_MEASURES = "__all_ranking_measures__";
export const ALL_RANKING_STATISTICS = "__all_ranking_statistics__";

const isRankingMatrixCandidate = (matrix: MatrixRecord) => matrix.kind !== "reduced";

const matchesQueryPart = (
  matrix: MatrixRecord,
  query: RankingQuery,
  ignored: Array<keyof RankingQuery> = [],
) => {
  const patch = { ...query };
  ignored.forEach((key) => {
    delete patch[key];
  });
  return isRankingMatrixCandidate(matrix) && matrixMatchesRankingQuery(matrix, patch);
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
  { label: "Mean across bands", value: "meanAcrossMatrices" },
  { label: "Mean absolute across bands", value: "meanAbsAcrossMatrices" },
];

export const roiMetricOptions = [
  { label: "Mean incident value", value: "meanValue" },
  { label: "Mean absolute incident value", value: "meanAbsValue" },
  { label: "Max incident value", value: "maxValue" },
  { label: "Max absolute incident value", value: "maxAbsValue" },
];

export const topNOptions = [10, 25, 50, 100, 250, 500].map((value) => ({
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
      { label: getMatrixSourceLabel(matrix, connectivity) ?? source.sourceId, value },
    ];
  });
  return [{ label: "All sources", value: ALL_RANKING_SOURCES }, ...options];
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
  return [{ label: "All measures", value: ALL_RANKING_MEASURES }, ...options];
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
  return [{ label: "All statistics", value: ALL_RANKING_STATISTICS }, ...options];
};

export const getCompatibleBandOptions = (
  connectivity: ConnectivityDataState | null | undefined,
  query: RankingQuery,
) => {
  if (!connectivity) return [];
  const bands = connectivity.matrices
    .filter((matrix) => matchesQueryPart(matrix, query, ["bandIds"]))
    .map((matrix) => matrix.context.bandId ?? "none");
  const uniqueBands = Array.from(new Set(bands));
  return [
    { label: "All compatible bands", value: ALL_COMPATIBLE_BANDS },
    ...uniqueBands.map((bandId) => ({
      label: connectivity.catalogs.bands[bandId]?.label ?? bandId,
      value: bandId,
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
      label: `${getMatrixLabel(matrix, connectivity)} · ${toRankingMatrixKind(matrix.kind)}`,
      value: matrix.id,
      matrix,
    }));
};

export const findMatrix = (
  connectivity: ConnectivityDataState | null | undefined,
  matrixId?: string,
): MatrixRecord | undefined =>
  matrixId && connectivity ? connectivity.matrixIndex[matrixId] : undefined;

export const getRankingQueryMissingFields = (
  query: RankingQuery,
  connectivity?: ConnectivityDataState | null,
) => {
  const missing: string[] = [];
  if (!connectivity) missing.push("dataset");
  if (!query.target) missing.push("target");
  if (!query.metric) missing.push("metric");
  if (!query.topN) missing.push("top N");
  if (
    query.target === "links" &&
    query.bandIds &&
    query.bandIds.length !== 1 &&
    !query.linkCollectionMode
  ) {
    missing.push("multi-band mode");
  }
  return missing;
};

const titleCaseTarget = (target: RankingQuery["target"]) => {
  if (target === "rois") return "ROIs";
  return target.charAt(0).toUpperCase() + target.slice(1);
};

const optionLabel = (options: Option[], value?: string) =>
  value ? options.find((option) => option.value === value)?.label ?? value : undefined;

const rankingMetricLabel = (query: RankingQuery) => {
  const options =
    query.target === "matrices"
      ? matrixMetricOptions
      : query.target === "links"
        ? linkMetricOptions
        : roiMetricOptions;
  return optionLabel(options, query.metric) ?? query.metric;
};

const rankingModeLabel = (query: RankingQuery) => {
  if (query.target !== "links") return undefined;
  if (query.linkCollectionMode === "expanded") return "one row per band";
  return "aggregated bands";
};

const rankingBandLabel = (
  connectivity: ConnectivityDataState,
  query: RankingQuery,
) => {
  const bandIds = query.bandIds ?? [];
  if (bandIds.length === 0 || bandIds.includes(ALL_COMPATIBLE_BANDS)) {
    return "all bands";
  }
  if (bandIds.length === 1) {
    const bandId = bandIds[0];
    return connectivity.catalogs.bands[bandId]?.label ?? bandId;
  }
  return `${bandIds.length} bands`;
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
  const bands = connectivity ? rankingBandLabel(connectivity, query) : undefined;
  const mode = rankingModeLabel(query);

  return [
    `${titleCaseTarget(query.target)} ranking`,
    rankingMetricLabel(query),
    source,
    measure,
    statistic,
    bands,
    mode,
    `top ${query.topN}`,
  ]
    .filter(Boolean)
    .join(" · ");
};
