import { createFullMatrixData } from "@/networkDerivation/calculations/matrixMath";
import {
  assertContextCompatible,
  findEquivalentDerivedNetwork,
  resolveCalculationInputsForDimensions,
} from "@/networkDerivation/calculations/resolution";
import { isValidSampleSize, populationSampleSize } from "@/networkDerivation/calculations/sampleSizes";
import {
  type DimensionComparison,
  type NetworkCalculationBatchRequest,
  type NetworkCalculationOperation,
  type NetworkCalculationResult,
  type NetworkCalculationSkipped,
  type NetworkCalculationState,
} from "@/networkDerivation/calculations/types";
import type { MatrixCellValue, Network } from "@/types/network";

export const alternative = "two-sided";

export const ensureReady = (
  operation: NetworkCalculationOperation,
  dimensionPair: DimensionComparison,
  measureId: string,
  skipped: NetworkCalculationSkipped[],
  request: NetworkCalculationBatchRequest,
  state: NetworkCalculationState,
  subjectId?: string,
) => {
  const resolved = resolveCalculationInputsForDimensions(
    { ...request, operation },
    state,
    dimensionPair,
    measureId,
    subjectId,
  );
  if (resolved.missingRoles.length || resolved.warnings.length) {
    skipped.push({
      operation,
      dimensionPair,
      measureId,
      subjectId,
      leftPopulationId: request.leftPopulationId,
      rightPopulationId: request.rightPopulationId,
      referencePopulationId: request.referencePopulationId,
      reason: resolved.missingRoles.length ? `Missing inputs: ${resolved.missingRoles.join(", ")}` : resolved.warnings.join("; "),
      missingInputs: resolved.missingRoles,
    });
    return null;
  }
  try {
    assertContextCompatible(
      Object.values(resolved.networks).filter(Boolean) as Network[],
    );
  } catch (error) {
    skipped.push({
      operation,
      dimensionPair,
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
  source: Network,
  callback: (i: number, j: number) => MatrixCellValue,
) => createFullMatrixData([source.nodeIds.length, source.nodeIds.length], callback);

export const maybePush = (
  network: Network,
  state: NetworkCalculationState,
  result: NetworkCalculationResult,
) => {
  const existing = findEquivalentDerivedNetwork(network, state.networkIndex);
  if (existing) {
    result.existing.push(existing);
    return;
  }
  result.networks.push(network);
};

export const resolvePopulationSampleSizesOrSkip = (
  operation: NetworkCalculationOperation,
  dimensionPair: DimensionComparison,
  measureId: string,
  request: NetworkCalculationBatchRequest,
  state: NetworkCalculationState,
  leftMean: Network,
  rightMean: Network,
  skipped: NetworkCalculationSkipped[],
) => {
  const nLeft = populationSampleSize(leftMean.sourceId, request, state);
  const nRight = populationSampleSize(rightMean.sourceId, request, state);
  if (!isValidSampleSize(nLeft) || !isValidSampleSize(nRight)) {
    skipped.push({
      operation,
      dimensionPair,
      measureId,
      leftPopulationId: request.leftPopulationId,
      rightPopulationId: request.rightPopulationId,
      reason: "n_left and n_right must both be greater than 1.",
    });
    return null;
  }
  return { nLeft, nRight };
};
