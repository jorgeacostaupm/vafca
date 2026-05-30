import type {
  MatrixCellValue,
  MatrixRecord,
} from "@/types/connectivityBundle";
import {
  type MatrixCalculationBatchRequest,
  type MatrixCalculationOperation,
  type MatrixCalculationResult,
  type MatrixCalculationSkipped,
  type MatrixCalculationState,
} from "@/connectivity/calculations/types";
import {
  assertContextCompatible,
  findEquivalentDerivedMatrix,
  resolveCalculationInputsForLayerMeasure,
} from "@/connectivity/calculations/resolution";
import { createFullMatrixData } from "@/connectivity/calculations/matrixMath";

export const alternative = "two-sided";

const getPopulationNFromMatrixOrCatalog = (
  matrix: MatrixRecord | undefined,
  state: MatrixCalculationState,
  populationId?: string,
) => {
  if (matrix?.source.level === "population" && Number.isFinite(matrix.source.n)) {
    return matrix.source.n;
  }
  return populationId ? state.catalogs.populations[populationId]?.n ?? null : null;
};

export const ensureReady = (
  operation: MatrixCalculationOperation,
  layerId: string,
  measureId: string,
  skipped: MatrixCalculationSkipped[],
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
  subjectId?: string,
) => {
  const resolved = resolveCalculationInputsForLayerMeasure(
    { ...request, operation },
    state,
    layerId,
    measureId,
    subjectId,
  );
  if (resolved.missingRoles.length) {
    skipped.push({
      operation,
      layerId,
      measureId,
      subjectId,
      leftPopulationId: request.leftPopulationId,
      rightPopulationId: request.rightPopulationId,
      referencePopulationId: request.referencePopulationId,
      reason: `Missing inputs: ${resolved.missingRoles.join(", ")}`,
      missingInputs: resolved.missingRoles,
    });
    return null;
  }
  try {
    assertContextCompatible(Object.values(resolved.matrices).filter(Boolean) as MatrixRecord[]);
  } catch (error) {
    skipped.push({
      operation,
      layerId,
      measureId,
      subjectId,
      leftPopulationId: request.leftPopulationId,
      rightPopulationId: request.rightPopulationId,
      referencePopulationId: request.referencePopulationId,
      reason: error instanceof Error ? error.message : "Context is incompatible.",
    });
    return null;
  }
  return resolved;
};

export const createBinaryData = (
  source: MatrixRecord,
  callback: (i: number, j: number) => MatrixCellValue,
) => createFullMatrixData(source.geometry.shape, callback);

export const maybePush = (
  matrix: MatrixRecord,
  state: MatrixCalculationState,
  result: MatrixCalculationResult,
) => {
  const existing = findEquivalentDerivedMatrix(matrix, state.matrixIndex);
  if (existing) {
    result.existing.push(existing);
    return;
  }
  result.matrices.push(matrix);
};

export const resolvePopulationSampleSizesOrSkip = (
  operation: MatrixCalculationOperation,
  layerId: string,
  measureId: string,
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
  leftMean: MatrixRecord,
  rightMean: MatrixRecord,
  skipped: MatrixCalculationSkipped[],
) => {
  const nLeft = getPopulationNFromMatrixOrCatalog(leftMean, state, request.leftPopulationId);
  const nRight = getPopulationNFromMatrixOrCatalog(rightMean, state, request.rightPopulationId);
  if (!nLeft || !nRight || nLeft <= 1 || nRight <= 1) {
    skipped.push({
      operation,
      layerId,
      measureId,
      leftPopulationId: request.leftPopulationId,
      rightPopulationId: request.rightPopulationId,
      reason: "n_left and n_right must both be greater than 1.",
    });
    return null;
  }
  return { nLeft, nRight };
};
