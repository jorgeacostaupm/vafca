import type { ConnectivityMatrix, MatrixViewData } from "@/types/connectivityBundle";
import type { DatasetMeta, MatrixStats } from "@/types/datasetState";
import type { MatrixOrderEntry } from "@/types/matrixOrder";
import type { MatrixSummary, StoredMatrix } from "@/types/matrixStore";
import { materializeMatrixData } from "@/utils/connectivityMatrix";
import { getMatrixPopulationIds } from "@/utils/matrixSource";
import { buildMatrixStats } from "@/utils/matrixStats";
import { createCompoundId } from "@/utils/matrixStore";

const toMatrixOrderTags = (tags: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(tags).filter(
      (entry): entry is [string, string | number | boolean | null] => {
        const value = entry[1];
        return (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          value === null
        );
      },
    ),
  );

export const getDatasetCatalogs = (dataset: DatasetMeta | null | undefined) =>
  dataset?.content.catalogs;

export const getDatasetMatrixOrder = (
  dataset: DatasetMeta | null | undefined,
): MatrixOrderEntry[] =>
  [...(dataset?.content.atlas.rois ?? [])]
    .sort((a, b) => a.index - b.index)
    .map((roi) => ({
      id: String(roi.id),
      label: roi.name,
      name: roi.name,
      acronym: roi.label,
      tags: toMatrixOrderTags(roi.tags),
      metadata: roi.metadata,
    }));

export const getDatasetAtlasId = (dataset: DatasetMeta | null | undefined) =>
  dataset?.content.atlas.id;

export const getDatasetAtlasLabel = (dataset: DatasetMeta | null | undefined) =>
  dataset?.content.atlas.name ?? "Unknown";

export const toMatrixViewData = (matrix: ConnectivityMatrix): MatrixViewData => ({
  id: matrix.id,
  layerId: matrix.context.layerId ?? "none",
  measureId: matrix.context.measureId,
  statId: matrix.stat.id,
  populationIds: getMatrixPopulationIds(matrix),
  data: materializeMatrixData(matrix),
  symmetric: matrix.encoding.symmetric,
  dataStats: matrix.dataStats,
});

export const getDatasetMatrixStats = (
  dataset: DatasetMeta | null | undefined,
): MatrixStats =>
  buildMatrixStats(
    (dataset?.content.matrices ?? []).map(toMatrixViewData),
  );

export const toStoredMatrix = (matrix: ConnectivityMatrix): StoredMatrix => {
  const matrixViewData = toMatrixViewData(matrix);
  return {
    ...matrixViewData,
    compoundId: createCompoundId(matrixViewData),
  };
};

export const getDatasetMatrixSummaries = (
  dataset: DatasetMeta | null | undefined,
): MatrixSummary[] =>
  (dataset?.content.matrices ?? []).map((matrix) => {
    const stored = toStoredMatrix(matrix);
    return {
      compoundId: stored.compoundId,
      layerId: stored.layerId,
      measureId: stored.measureId,
      statId: stored.statId,
      populationIds: stored.populationIds,
      size: stored.data.length,
      symmetric: stored.symmetric,
    };
  });

export const getDatasetMatrixByCompoundId = (
  dataset: DatasetMeta | null | undefined,
  compoundId: string,
): StoredMatrix | undefined =>
  (dataset?.content.matrices ?? [])
    .map(toStoredMatrix)
    .find((matrix) => matrix.compoundId === compoundId);
