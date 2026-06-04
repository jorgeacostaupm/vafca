import {
  DEFAULT_LINK_RANKING_ALLOW_AUTOCONNECTIONS,
  DEFAULT_ROI_RANKING_ALLOW_AUTOCONNECTIONS,
} from "@/config/ui";
import type {
  ConnectivityDataState,
  ConnectivityMatrix,
} from "@/types/connectivityBundle";
import type {
  LinkRankingRow,
  MatrixRankingRow,
  RankingQuery,
  RankingResult,
  RoiRankingRow,
} from "@/types/rankings";
import { iterateMatrixEdges } from "@/utils/connectivityMatrix";
import {
  getMatrixAggregationGroupingKey,
  getMatrixLabel,
  getMatrixSource,
  resolveMatrixEndpointIds,
  resolveRankingMatrixCollection,
} from "@/utils/rankings/rankingMatrixMetadata";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const mean = (values: number[]) =>
  values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : Number.NaN;

const sortRows = <T extends { score: number }>(rows: T[], metric?: string) => {
  const ascending = metric === "lowestValue" || metric === "minValue";
  return [...rows].sort((a, b) =>
    ascending ? a.score - b.score : b.score - a.score,
  );
};

const scoreValues = (values: number[], metric?: string, threshold = 0) => {
  if (values.length === 0) return Number.NaN;
  switch (metric) {
    case "meanValue":
    case "meanAcrossMatrices":
      return mean(values);
    case "medianValue": {
      const sorted = [...values].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
    }
    case "meanAbsValue":
    case "meanAbsAcrossMatrices":
      return mean(values.map(Math.abs));
    case "maxValue":
    case "highestValue":
      return Math.max(...values);
    case "maxAbsValue":
    case "highestAbsValue":
      return Math.max(...values.map(Math.abs));
    case "minValue":
    case "lowestValue":
      return Math.min(...values);
    case "countAboveThreshold":
      return values.filter((value) => value > threshold).length;
    case "percentAboveThreshold":
      return (values.filter((value) => value > threshold).length / values.length) * 100;
    case "countAbsAboveThreshold":
      return values.filter((value) => Math.abs(value) > threshold).length;
    default:
      return Number.NaN;
  }
};

const getEndpointLabel = (
  connectivity: ConnectivityDataState,
  id: string,
  matrix?: ConnectivityMatrix,
) =>
  matrix?.aggregation?.groups.find((group) => group.id === id)?.label ??
  connectivity.atlas.rois.find((roi) => roi.id === id)?.label ??
  connectivity.atlas.rois.find((roi) => String(roi.atlasId) === id)?.label ??
  id;

const getEndpointGroup = (connectivity: ConnectivityDataState, id: string) => {
  const roi = connectivity.atlas.rois.find((item) => item.id === id);
  const network = roi?.tags.network ?? roi?.tags.group ?? roi?.tags.region;
  return typeof network === "string" ? network : undefined;
};

const getActiveRoiIds = (activeLabels: Set<string> | null) => activeLabels;

const isEligibleEdge = (
  matrix: ConnectivityMatrix,
  connectivity: ConnectivityDataState,
  i: number,
  j: number,
  activeRois: Set<string> | null,
  activeFilterMask: boolean[][] | null,
) => {
  const ids = resolveMatrixEndpointIds(matrix, connectivity);
  const sourceId = ids[i];
  const targetId = ids[j];
  if (!sourceId || !targetId) return false;
  if (matrix.kind !== "aggregated") {
    const active = getActiveRoiIds(activeRois);
    if (active && (!active.has(sourceId) || !active.has(targetId))) return false;
  }
  if (activeFilterMask && matrix.kind !== "aggregated") {
    return Boolean(activeFilterMask[i]?.[j] ?? activeFilterMask[j]?.[i]);
  }
  return true;
};

type CalculationContext = {
  datasetContent: ConnectivityDataState;
  query: RankingQuery;
  activeRois: Set<string> | null;
  activeFilterMask: boolean[][] | null;
};

export const computeMatrixRanking = ({
  datasetContent: connectivity,
  query,
  activeRois,
  activeFilterMask,
}: CalculationContext): Omit<RankingResult, "id" | "createdAt"> => {
  const matrices = resolveRankingMatrixCollection(connectivity, query);
  const rows = matrices
    .map<MatrixRankingRow | null>((matrix) => {
      const values: number[] = [];
      for (const edge of iterateMatrixEdges(matrix)) {
        if (
          !isEligibleEdge(
            matrix,
            connectivity,
            edge.i,
            edge.j,
            activeRois,
            activeFilterMask,
          )
        ) {
          continue;
        }
        if (isFiniteNumber(edge.value)) values.push(edge.value);
      }
      const score = scoreValues(values, query.metric, query.threshold);
      if (!Number.isFinite(score)) return null;
      const source = getMatrixSource(matrix);
      return {
        type: "matrix",
        rank: 0,
        matrixId: matrix.id,
        label: getMatrixLabel(matrix, connectivity),
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        matrixKind: matrix.kind,
        aggregationGroupingKey: getMatrixAggregationGroupingKey(matrix),
        measureId: matrix.context.measureId,
        statisticId: matrix.stat.id,
        layerId: matrix.context.layerId ?? "none",
        score,
        nLinksUsed: values.length,
      };
    })
    .filter((row): row is MatrixRankingRow => Boolean(row));

  const rankedRows = sortRows(rows, query.metric)
    .slice(0, query.topN)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  return { query, rows: rankedRows, totalEligibleItems: rows.length };
};

const getLinkKey = (a: string, b: string) => [a, b].sort().join("__");

export const computeLinkRanking = ({
  datasetContent: connectivity,
  query,
  activeRois,
  activeFilterMask,
}: CalculationContext): Omit<RankingResult, "id" | "createdAt"> => {
  const matrices = resolveRankingMatrixCollection(connectivity, query);
  const expanded = query.linkCollectionMode === "expanded" || matrices.length <= 1;
  const allowAutoconnections =
    query.allowLinkRankingAutoconnections ??
    DEFAULT_LINK_RANKING_ALLOW_AUTOCONNECTIONS;
  const grouped = new Map<
    string,
    {
      sourceId: string;
      targetId: string;
      valuesByMatrix: Record<string, number>;
      valuesByLayer: Record<string, number[]>;
      values: number[];
      bestMatrixId?: string;
      bestLayerId?: string;
      bestValue?: number;
    }
  >();

  const rows: LinkRankingRow[] = [];
  matrices.forEach((matrix) => {
    const endpoints = resolveMatrixEndpointIds(matrix, connectivity);
    for (const edge of iterateMatrixEdges(matrix)) {
      if (!allowAutoconnections && edge.i === edge.j) continue;
      if (!isFiniteNumber(edge.value)) continue;
      if (
        !isEligibleEdge(
          matrix,
          connectivity,
          edge.i,
          edge.j,
          activeRois,
          activeFilterMask,
        )
      ) {
        continue;
      }
      const sourceId = endpoints[edge.i];
      const targetId = endpoints[edge.j];
      if (!sourceId || !targetId) continue;
      const score = scoreValues([edge.value], query.metric, query.threshold);
      if (!Number.isFinite(score)) continue;

      if (expanded) {
        rows.push({
          type: "link",
          rank: 0,
          sourceId,
          targetId,
          endpointType: matrix.kind === "aggregated" ? "group" : "roi",
          sourceLabel: getEndpointLabel(connectivity, sourceId, matrix),
          targetLabel: getEndpointLabel(connectivity, targetId, matrix),
          score,
          valuesByMatrix: { [matrix.id]: edge.value },
          valuesByLayer: { [matrix.context.layerId ?? "none"]: edge.value },
          bestMatrixId: matrix.id,
          bestLayerId: matrix.context.layerId ?? "none",
          nMatricesUsed: 1,
        });
        continue;
      }

      const key = getLinkKey(sourceId, targetId);
      const group =
        grouped.get(key) ??
        {
          sourceId,
          targetId,
          valuesByMatrix: {},
          valuesByLayer: {},
          values: [],
        };
      const layerId = matrix.context.layerId ?? "none";
      group.valuesByMatrix[matrix.id] = edge.value;
      group.valuesByLayer[layerId] = [...(group.valuesByLayer[layerId] ?? []), edge.value];
      group.values.push(edge.value);
      const comparable = Math.abs(edge.value);
      if (group.bestValue === undefined || comparable > Math.abs(group.bestValue)) {
        group.bestValue = edge.value;
        group.bestMatrixId = matrix.id;
        group.bestLayerId = matrix.context.layerId ?? "none";
      }
      grouped.set(key, group);
    }
  });

  if (!expanded) {
    grouped.forEach((group) => {
      const score = scoreValues(group.values, query.metric, query.threshold);
      if (!Number.isFinite(score)) return;
      rows.push({
        type: "link",
        rank: 0,
        sourceId: group.sourceId,
        targetId: group.targetId,
        endpointType: matrices[0]?.kind === "aggregated" ? "group" : "roi",
        sourceLabel: getEndpointLabel(connectivity, group.sourceId, matrices[0]),
        targetLabel: getEndpointLabel(connectivity, group.targetId, matrices[0]),
        score,
        valuesByMatrix: group.valuesByMatrix,
        valuesByLayer: Object.fromEntries(
          Object.entries(group.valuesByLayer).map(([layerId, values]) => [
            layerId,
            mean(values),
          ]),
        ),
        bestMatrixId: group.bestMatrixId,
        bestLayerId: group.bestLayerId,
        nMatricesUsed: group.values.length,
      });
    });
  }

  const rankedRows = sortRows(rows, query.metric)
    .slice(0, query.topN)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  return { query, rows: rankedRows, totalEligibleItems: rows.length };
};

export const computeRoiRanking = ({
  datasetContent: connectivity,
  query,
  activeRois,
  activeFilterMask,
}: CalculationContext): Omit<RankingResult, "id" | "createdAt"> => {
  const matrices = resolveRankingMatrixCollection(connectivity, query).filter(
    (matrix) => matrix.kind !== "aggregated",
  );
  const allowAutoconnections =
    query.allowRoiRankingAutoconnections ??
    DEFAULT_ROI_RANKING_ALLOW_AUTOCONNECTIONS;
  const scores = new Map<string, number[]>();
  const addRoiScore = (roiId: string | undefined, value: number) => {
    if (!roiId) return;
    const values = scores.get(roiId) ?? [];
    values.push(value);
    scores.set(roiId, values);
  };

  matrices.forEach((matrix) => {
    const endpoints = resolveMatrixEndpointIds(matrix, connectivity);
    for (const edge of iterateMatrixEdges(matrix)) {
      if (!allowAutoconnections && edge.i === edge.j) continue;
      if (!isFiniteNumber(edge.value)) continue;
      if (
        !isEligibleEdge(
          matrix,
          connectivity,
          edge.i,
          edge.j,
          activeRois,
          activeFilterMask,
        )
      ) {
        continue;
      }
      addRoiScore(endpoints[edge.i], edge.value);
      if (edge.i !== edge.j) {
        addRoiScore(endpoints[edge.j], edge.value);
      }
    }
  });

  const rows: RoiRankingRow[] = Array.from(scores.entries())
    .map(([roiId, values]) => {
      const score = scoreValues(values, query.metric, query.threshold);
      return {
        type: "roi" as const,
        rank: 0,
        roiId,
        label: getEndpointLabel(connectivity, roiId),
        group: getEndpointGroup(connectivity, roiId),
        score,
        nIncidentLinks: values.length,
        meanValue: mean(values),
        maxValue: values.length ? Math.max(...values) : undefined,
      };
    })
    .filter((row) => Number.isFinite(row.score));

  const rankedRows = sortRows(rows, query.metric)
    .slice(0, query.topN)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  return { query, rows: rankedRows, totalEligibleItems: rows.length };
};

export const computeRanking = (context: CalculationContext) => {
  if (context.query.target === "matrices") return computeMatrixRanking(context);
  if (context.query.target === "links") return computeLinkRanking(context);
  return computeRoiRanking(context);
};
