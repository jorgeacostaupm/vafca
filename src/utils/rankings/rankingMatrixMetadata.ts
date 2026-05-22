import { createCompoundId } from "@/utils/matrixStore";
import type {
  ConnectivityDataState,
  MatrixKind,
  MatrixRecord,
} from "@/types/connectivityBundle";
import type { ConnectivityMatrix } from "@/types/matrix";
import type { MatrixKindForRanking, RankingQuery } from "@/types/rankings";
import { formatPopulationSetLabel } from "@/utils/matrixViewUtils";

export const ALL_COMPATIBLE_BANDS = "__all_compatible_bands__";

export const toRankingMatrixKind = (
  kind: MatrixKind,
): MatrixKindForRanking => {
  if (kind === "comparison") return "comparison";
  if (kind === "reduced") return "aggregated";
  return "original";
};

export const getMatrixSource = (
  matrix: MatrixRecord,
): { sourceType?: RankingQuery["sourceType"]; sourceId?: string } => {
  if (matrix.source.level === "population") {
    return {
      sourceType: "population",
      sourceId: [...matrix.source.populationIds].sort().join("+"),
    };
  }
  if (matrix.source.level === "subject") {
    return { sourceType: "subject", sourceId: matrix.source.subjectId };
  }
  if (matrix.source.level === "comparison") {
    const left =
      matrix.source.left.label ??
      matrix.source.left.subjectId ??
      matrix.source.left.populationIds?.join("+") ??
      "left";
    const right =
      matrix.source.right.label ??
      matrix.source.right.subjectId ??
      matrix.source.right.populationIds?.join("+") ??
      "right";
    return { sourceType: "comparison", sourceId: `${left} vs ${right}` };
  }
  return {};
};

export const getMatrixSourceLabel = (
  matrix: MatrixRecord,
  connectivity: ConnectivityDataState,
) => {
  if (matrix.source.level === "population") {
    return formatPopulationSetLabel(
      matrix.source.populationIds,
      connectivity.catalogs,
    );
  }
  if (matrix.source.level === "subject") {
    return (
      connectivity.catalogs.subjects[matrix.source.subjectId]?.label ??
      matrix.source.subjectId
    );
  }
  if (matrix.source.level === "comparison") {
    const left =
      matrix.source.left.label ??
      (matrix.source.left.populationIds
        ? formatPopulationSetLabel(
            matrix.source.left.populationIds,
            connectivity.catalogs,
          )
        : undefined) ??
      matrix.source.left.subjectId ??
      "left";
    const right =
      matrix.source.right.label ??
      (matrix.source.right.populationIds
        ? formatPopulationSetLabel(
            matrix.source.right.populationIds,
            connectivity.catalogs,
          )
        : undefined) ??
      matrix.source.right.subjectId ??
      "right";
    return `${left} vs ${right}`;
  }
  return undefined;
};

export const getMatrixCompoundId = (matrix: MatrixRecord) => {
  const source = getMatrixSource(matrix);
  const populationIds =
    matrix.source.level === "comparison"
      ? [
          ...(matrix.source.left.populationIds ?? []),
          ...(matrix.source.right.populationIds ?? []),
        ]
      : "populationIds" in matrix.source
        ? matrix.source.populationIds
        : source.sourceId
          ? [source.sourceId]
          : [];

  const legacyMatrixIdentity: Pick<
    ConnectivityMatrix,
    "id" | "bandId" | "measureId" | "statId" | "populationIds"
  > = {
    id: matrix.id,
    bandId: matrix.context.bandId ?? "none",
    measureId: matrix.context.measureId,
    statId: matrix.stat.id,
    populationIds,
  };
  return createCompoundId(legacyMatrixIdentity);
};

export const getMatrixLabel = (
  matrix: MatrixRecord,
  connectivity: ConnectivityDataState,
) => {
  if (matrix.label) return matrix.label;
  const source = getMatrixSourceLabel(matrix, connectivity);
  const measure =
    connectivity.catalogs.measures[matrix.context.measureId]?.label ??
    matrix.context.measureId;
  const stat = connectivity.catalogs.stats[matrix.stat.id]?.label ?? matrix.stat.id;
  const bandId = matrix.context.bandId ?? "none";
  const band = connectivity.catalogs.bands[bandId]?.label ?? bandId;
  return [source, measure, band, stat].filter(Boolean).join(" / ");
};

export const getMatrixEndpointIds = (matrix: MatrixRecord): string[] =>
  matrix.geometry.roiOrder ?? matrix.reduction?.groups.map((group) => group.id) ?? [];

export const resolveMatrixEndpointIds = (
  matrix: MatrixRecord,
  connectivity: ConnectivityDataState,
): string[] => {
  const explicit = getMatrixEndpointIds(matrix);
  if (explicit.length > 0) return explicit;
  if (matrix.geometry.roiOrderRef === "atlas.rois") {
    return [...connectivity.atlas.rois]
      .sort((a, b) => a.index - b.index)
      .map((roi) => roi.id);
  }
  return [];
};

export const matrixMatchesRankingQuery = (
  matrix: MatrixRecord,
  query: RankingQuery,
) => {
  if (matrix.kind === "reduced") return false;
  const source = getMatrixSource(matrix);
  const bandId = matrix.context.bandId ?? "none";
  const bandIds = query.bandIds ?? [];
  const usesAllBands =
    bandIds.length === 0 || bandIds.includes(ALL_COMPATIBLE_BANDS);

  return (
    (!query.sourceType || source.sourceType === query.sourceType) &&
    (!query.sourceId || source.sourceId === query.sourceId) &&
    (!query.measureId || matrix.context.measureId === query.measureId) &&
    (!query.statisticId || matrix.stat.id === query.statisticId) &&
    (usesAllBands || bandIds.includes(bandId))
  );
};

export const resolveRankingMatrixCollection = (
  connectivity: ConnectivityDataState,
  query: RankingQuery,
) => {
  const directIds = query.matrixIds?.length
    ? query.matrixIds
    : query.matrixId
      ? [query.matrixId]
      : [];
  if (directIds.length > 0) {
    return directIds
      .map((id) => connectivity.matrixIndex[id])
      .filter((matrix): matrix is MatrixRecord => Boolean(matrix));
  }
  const matches = connectivity.matrices.filter((matrix) =>
    matrixMatchesRankingQuery(matrix, query),
  );
  const first = matches[0];
  if (!first) return [];
  const firstEndpointKey = JSON.stringify(resolveMatrixEndpointIds(first, connectivity));
  return matches.filter(
    (matrix) =>
      toRankingMatrixKind(matrix.kind) === toRankingMatrixKind(first.kind) &&
      matrix.geometry.atlasId === first.geometry.atlasId &&
      matrix.geometry.shape[0] === first.geometry.shape[0] &&
      matrix.geometry.shape[1] === first.geometry.shape[1] &&
      JSON.stringify(resolveMatrixEndpointIds(matrix, connectivity)) ===
        firstEndpointKey,
  );
};
