import { populationCohensD } from "@/networkDerivation/calculations/methods/populationCohensD";
import { populationDifference } from "@/networkDerivation/calculations/methods/populationDifference";
import { populationOneSampleZScore } from "@/networkDerivation/calculations/methods/populationOneSampleZScore";
import { subjectDifference } from "@/networkDerivation/calculations/methods/subjectDifference";
import { subjectZScoreVsPopulation } from "@/networkDerivation/calculations/methods/subjectZScoreVsPopulation";
import { twoSampleZTest } from "@/networkDerivation/calculations/methods/twoSampleZTest";
import { welchTTest } from "@/networkDerivation/calculations/methods/welchTTest";
import type {
  NetworkCalculationMethod,
  NetworkCalculationMethodDefinition,
  NetworkCalculationOperation,
} from "@/networkDerivation/calculations/types";

import { correlation } from "./correlation";

const methods: NetworkCalculationMethod[] = [
  correlation,
  subjectZScoreVsPopulation,
  subjectDifference,
  populationOneSampleZScore,
  populationDifference,
  populationCohensD,
  twoSampleZTest,
  welchTTest,
];

const definitions: NetworkCalculationMethodDefinition[] = [
  correlation.definition,
  subjectZScoreVsPopulation.definition,
  subjectDifference.definition,
  populationOneSampleZScore.definition,
  populationDifference.definition,
  populationCohensD.definition,
  twoSampleZTest.definition,
  welchTTest.definition,
];

const methodById = Object.fromEntries(
  methods.map((method) => [method.definition.id, method]),
) as Record<NetworkCalculationOperation, NetworkCalculationMethod>;

const definitionById = Object.fromEntries(
  definitions.map((definition) => [definition.id, definition]),
) as Record<NetworkCalculationOperation, NetworkCalculationMethodDefinition>;

export const getNetworkCalculationMethodDefinitions = () => definitions;

export const getNetworkCalculationMethodDefinition = (
  operation: NetworkCalculationOperation,
) => definitionById[operation];

export const getNetworkCalculationMethod = (operation: NetworkCalculationOperation) =>
  methodById[operation];

export { definitions as networkCalculationMethodDefinitions };
export { methods as networkCalculationMethods };
