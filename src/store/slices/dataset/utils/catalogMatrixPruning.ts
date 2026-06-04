import type { ConnectivityMatrix } from "@/types/connectivityBundle";
import type { UpdateCatalogPayload } from "@/types/datasetState";
import type { MatrixSummary } from "@/types/matrixStore";
import { getMatrixPopulationIds } from "@/utils/matrixSource";

export type CatalogMatrixPrunePayload = {
  catalog: UpdateCatalogPayload["catalog"];
  id: string;
  invalidCompoundIds: string[];
  invalidMatrixIds: string[];
};

export const summaryMatchesCatalogItem = (
  summary: MatrixSummary,
  catalog: UpdateCatalogPayload["catalog"],
  id: string,
) => {
  if (catalog === "populations") return summary.populationIds.includes(id);
  if (catalog === "measures") return summary.measureId === id;
  if (catalog === "stats") return summary.statId === id;
  if (catalog === "layers") return summary.layerId === id;
  return false;
};

export const getInvalidCompoundIdsForCatalogItem = (
  summaries: MatrixSummary[],
  catalog: UpdateCatalogPayload["catalog"],
  id: string,
) =>
  summaries
    .filter((summary) => summaryMatchesCatalogItem(summary, catalog, id))
    .map((summary) => summary.compoundId);

export const matrixMatchesCatalogItem = (
  matrix: ConnectivityMatrix,
  catalog: UpdateCatalogPayload["catalog"],
  id: string,
) => {
  if (catalog === "populations") return getMatrixPopulationIds(matrix).includes(id);
  if (catalog === "measures") return matrix.context.measureId === id;
  if (catalog === "stats") return matrix.stat.id === id;
  if (catalog === "layers") return (matrix.context.layerId ?? "none") === id;
  return false;
};

export const getInvalidMatrixIdsForCatalogItem = (
  matrices: ConnectivityMatrix[],
  catalog: UpdateCatalogPayload["catalog"],
  id: string,
) =>
  matrices
    .filter((matrix) => matrixMatchesCatalogItem(matrix, catalog, id))
    .map((matrix) => matrix.id);
