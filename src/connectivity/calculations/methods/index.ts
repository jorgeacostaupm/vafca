import { populationCohensD } from "@/connectivity/calculations/methods/populationCohensD";
import { populationDifference } from "@/connectivity/calculations/methods/populationDifference";
import { populationReferenceZScore } from "@/connectivity/calculations/methods/populationReferenceZScore";
import { subjectZScoreVsPopulation } from "@/connectivity/calculations/methods/subjectZScoreVsPopulation";
import { twoSampleZTest } from "@/connectivity/calculations/methods/twoSampleZTest";
import { welchTTest } from "@/connectivity/calculations/methods/welchTTest";
import type {
  MatrixCalculationMethodDefinition,
  MatrixCalculationOperation,
} from "@/connectivity/calculations/types";

const definitions: MatrixCalculationMethodDefinition[] = [
  subjectZScoreVsPopulation,
  populationReferenceZScore,
  populationDifference,
  populationCohensD,
  twoSampleZTest,
  welchTTest,
];

const definitionById = Object.fromEntries(
  definitions.map((definition) => [definition.id, definition]),
) as Record<MatrixCalculationOperation, MatrixCalculationMethodDefinition>;

export const getMatrixCalculationMethodDefinitions = () => definitions;

export const getMatrixCalculationMethodDefinition = (
  operation: MatrixCalculationOperation,
) => definitionById[operation];

export { definitions as matrixCalculationMethodDefinitions };
