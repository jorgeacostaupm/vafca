import { getMatrixCalculationMethod } from "@/networkDerivation/calculations/methods";
import { validateMatrixCalculationRequest } from "@/networkDerivation/calculations/resolution";
import type {
  MatrixCalculationBatchRequest,
  MatrixCalculationResult,
  MatrixCalculationState,
} from "@/networkDerivation/calculations/types";

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
} from "@/networkDerivation/calculations/methods/populationCohensD";
export { calculatePopulationDifference } from "@/networkDerivation/calculations/methods/populationDifference";
export { calculatePopulationReferenceZScore } from "@/networkDerivation/calculations/methods/populationReferenceZScore";
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
