import { createFullMatrixData } from "@/networkDerivation/calculations/matrixMath";
import {
  assertContextCompatible,
  findEquivalentDerivedNetwork,
  resolveCalculationInputsForLayerMeasure,
} from "@/networkDerivation/calculations/resolution";
import {
  type NetworkCalculationBatchRequest,
  type NetworkCalculationOperation,
  type NetworkCalculationResult,
  type NetworkCalculationSkipped,
  type NetworkCalculationState,
} from "@/networkDerivation/calculations/types";
import type { MatrixCellValue, Network } from "@/types/network";

export const alternative = "two-sided";

const getPopulationNFromNetworkOrCatalog = (
  network: Network | undefined,
  state: NetworkCalculationState,
  populationId?: string,
) => {
  if (
    network?.source.type === "population" &&
    Number.isFinite(network.source.n)
  ) {
    return network.source.n;
  }
  return populationId ? state.catalogs.populations[populationId]?.n ?? null : null;
};

export const ensureReady = (
  operation: NetworkCalculationOperation,
  layerId: string,
  measureId: string,
  skipped: NetworkCalculationSkipped[],
  request: NetworkCalculationBatchRequest,
  state: NetworkCalculationState,
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
    assertContextCompatible(
      Object.values(resolved.networks).filter(Boolean) as Network[],
    );
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
  layerId: string,
  measureId: string,
  request: NetworkCalculationBatchRequest,
  state: NetworkCalculationState,
  leftMean: Network,
  rightMean: Network,
  skipped: NetworkCalculationSkipped[],
) => {
  const nLeft = getPopulationNFromNetworkOrCatalog(leftMean, state, request.leftPopulationId);
  const nRight = getPopulationNFromNetworkOrCatalog(rightMean, state, request.rightPopulationId);
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
