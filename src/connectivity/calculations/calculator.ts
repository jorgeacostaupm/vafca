import { getMatrixCalculationMethod } from "@/connectivity/calculations/methods";
import { validateMatrixCalculationRequest } from "@/connectivity/calculations/resolution";
import type {
  MatrixCalculationBatchRequest,
  MatrixCalculationResult,
  MatrixCalculationState,
} from "@/connectivity/calculations/types";

export const calculateDerivedMatrices = (
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
): MatrixCalculationResult => {
  const validation = validateMatrixCalculationRequest(request, state);
  if (!validation.valid) {
    return {
      matrices: [],
      warnings: validation.errors,
      skipped: [],
      existing: [],
    };
  }

  const result: MatrixCalculationResult = {
    matrices: [],
    warnings: [],
    skipped: [],
    existing: [],
  };
  const existingIds = new Set(state.matrices.map((matrix) => matrix.id));

  request.operations.forEach((operation) => {
    getMatrixCalculationMethod(operation)?.calculate({
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
} from "@/connectivity/calculations/methods/populationCohensD";
export { calculatePopulationDifference } from "@/connectivity/calculations/methods/populationDifference";
export { calculatePopulationReferenceZScore } from "@/connectivity/calculations/methods/populationReferenceZScore";
export { calculateSubjectDifference } from "@/connectivity/calculations/methods/subjectDifference";
export {
  calculatePopulationTwoSampleZPValue,
  calculatePopulationTwoSampleZTest,
} from "@/connectivity/calculations/methods/twoSampleZTest";
export {
  calculatePopulationWelchPValue,
  calculatePopulationWelchT,
} from "@/connectivity/calculations/methods/welchTTest";
export { calculateSubjectZScoreVsPopulation } from "@/connectivity/calculations/methods/subjectZScoreVsPopulation";
