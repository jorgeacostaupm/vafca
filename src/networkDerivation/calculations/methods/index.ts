import { populationCohensD } from "@/networkDerivation/calculations/methods/populationCohensD";
import { populationDifference } from "@/networkDerivation/calculations/methods/populationDifference";
import { populationReferenceZScore } from "@/networkDerivation/calculations/methods/populationReferenceZScore";
import { subjectDifference } from "@/networkDerivation/calculations/methods/subjectDifference";
import { subjectZScoreVsPopulation } from "@/networkDerivation/calculations/methods/subjectZScoreVsPopulation";
import { twoSampleZTest } from "@/networkDerivation/calculations/methods/twoSampleZTest";
import { welchTTest } from "@/networkDerivation/calculations/methods/welchTTest";
import type {
  MatrixCalculationMethod,
  MatrixCalculationMethodDefinition,
  MatrixCalculationOperation,
} from "@/networkDerivation/calculations/types";

const methods: MatrixCalculationMethod[] = [
  subjectZScoreVsPopulation,
  subjectDifference,
  populationReferenceZScore,
  populationDifference,
  populationCohensD,
  twoSampleZTest,
  welchTTest,
];

const definitions: MatrixCalculationMethodDefinition[] = [
  subjectZScoreVsPopulation.definition,
  subjectDifference.definition,
  populationReferenceZScore.definition,
  populationDifference.definition,
  populationCohensD.definition,
  twoSampleZTest.definition,
  welchTTest.definition,
];

const methodById = Object.fromEntries(
  methods.map((method) => [method.definition.id, method]),
) as Record<MatrixCalculationOperation, MatrixCalculationMethod>;

const definitionById = Object.fromEntries(
  definitions.map((definition) => [definition.id, definition]),
) as Record<MatrixCalculationOperation, MatrixCalculationMethodDefinition>;

export const getMatrixCalculationMethodDefinitions = () => definitions;

export const getMatrixCalculationMethodDefinition = (
  operation: MatrixCalculationOperation,
) => definitionById[operation];

export const getMatrixCalculationMethod = (operation: MatrixCalculationOperation) =>
  methodById[operation];

export { definitions as matrixCalculationMethodDefinitions };
export { methods as matrixCalculationMethods };
