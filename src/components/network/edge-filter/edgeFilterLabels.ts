import type { Catalogs, ConnectivityMatrix } from "@/types/connectivityBundle";
import { formatPopulationSetLabel } from "@/utils/matrixViewUtils";

export const formatMatrixSourceLabel = (
  matrix: ConnectivityMatrix,
  catalogs?: Catalogs,
) => {
  if (matrix.source.level === "subject") {
    return catalogs?.subjects[matrix.source.subjectId]?.label ?? matrix.source.subjectId;
  }
  if (matrix.source.level === "population") {
    return formatPopulationSetLabel(matrix.source.populationIds, catalogs);
  }
  if (matrix.source.level === "aggregation") {
    return `Aggregated from ${matrix.source.baseMatrixId}`;
  }
  const left =
    matrix.source.left.label ??
    (matrix.source.left.populationIds
      ? formatPopulationSetLabel(matrix.source.left.populationIds, catalogs)
      : undefined) ??
    matrix.source.left.subjectId ??
    "Left";
  const right =
    matrix.source.right.label ??
    (matrix.source.right.populationIds
      ? formatPopulationSetLabel(matrix.source.right.populationIds, catalogs)
      : undefined) ??
    matrix.source.right.subjectId ??
    "Right";
  return `${left} vs ${right}`;
};

export const formatMatrixKindLabel = (matrix: ConnectivityMatrix) => {
  if (matrix.kind === "aggregated") return "Aggregated";
  if (matrix.source.level === "population") return "Population";
  if (matrix.source.level === "subject") return "Subject";
  return "Comparison";
};

export const formatNetworkMatrixLabel = (
  matrix: ConnectivityMatrix,
  catalogs?: Catalogs,
) => {
  const source = formatMatrixSourceLabel(matrix, catalogs);
  const layer = matrix.context.layerId
    ? catalogs?.layers[matrix.context.layerId]?.label ?? matrix.context.layerId
    : "No layer";
  const measure = catalogs?.measures[matrix.context.measureId]?.label ?? matrix.context.measureId;
  const stat = catalogs?.stats[matrix.stat.id]?.label ?? matrix.stat.id;
  return matrix.label ?? `${source} · ${layer} · ${measure} · ${stat}`;
};
