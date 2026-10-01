import { getNetworkCalculationMethod } from "@/networkDerivation/calculations/methods";
import { validateNetworkCalculationRequest } from "@/networkDerivation/calculations/resolution";
import type {
  NetworkCalculationBatchRequest,
  NetworkCalculationResult,
  NetworkCalculationState,
} from "@/networkDerivation/calculations/types";

export const calculateDerivedNetworks = (
  request: NetworkCalculationBatchRequest,
  state: NetworkCalculationState,
): NetworkCalculationResult => {
  const validation = validateNetworkCalculationRequest(request, state);
  if (!validation.valid) {
    return {
      networks: [],
      warnings: validation.errors,
      skipped: [],
      existing: [],
    };
  }

  const result: NetworkCalculationResult = {
    networks: [],
    warnings: [],
    skipped: [],
    existing: [],
  };
  const existingIds = new Set(state.networks.map((network) => network.id));

  request.operations.forEach((operation) => {
    getNetworkCalculationMethod(operation)?.calculate({
      request,
      state,
      result,
      existingIds,
    });
  });

  result.warnings = Array.from(new Set(result.warnings));
  return result;
};

export {
  calculatePopulationCohensD,
  calculateStudentPValueFromCohensD,
  calculateStudentTFromCohensD,
} from "@/networkDerivation/calculations/methods/populationCohensD";
export { calculatePopulationDifference } from "@/networkDerivation/calculations/methods/populationDifference";
export { calculatePopulationOneSampleZScore } from "@/networkDerivation/calculations/methods/populationOneSampleZScore";
export { calculateSubjectDifference } from "@/networkDerivation/calculations/methods/subjectDifference";
export { calculateSubjectZScoreVsPopulation } from "@/networkDerivation/calculations/methods/subjectZScoreVsPopulation";
export {
  calculatePopulationTwoSampleZPValue,
  calculatePopulationTwoSampleZTest,
} from "@/networkDerivation/calculations/methods/twoSampleZTest";
export {
  calculatePopulationWelchPValue,
  calculatePopulationWelchT,
} from "@/networkDerivation/calculations/methods/welchTTest";
