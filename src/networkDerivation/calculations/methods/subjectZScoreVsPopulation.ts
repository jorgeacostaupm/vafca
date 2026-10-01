import { createComparisonNetwork } from "@/networkDerivation/calculations/comparisonNetworkRecord";
import { divideOrNull, getFiniteMatrixValueOrNull } from "@/networkDerivation/calculations/matrixMath";
import {
  createBinaryData,
  ensureReady,
  maybePush,
} from "@/networkDerivation/calculations/methodRuntime";
import type {
  NetworkCalculationMethod,
  NetworkCalculationMethodDefinition,
} from "@/networkDerivation/calculations/types";
import { EPSILON } from "@/networkDerivation/calculations/types";

export const subjectZScoreVsPopulationDefinition: NetworkCalculationMethodDefinition = {
  id: "subject_zscore_vs_population",
  label: "Subject vs reference population z-score",
  shortLabel: "Subject z-score",
  scope: "subject_vs_population",
  category: "descriptive_standardization",
  description: "Standardizes a subject network against a reference population mean and standard deviation.",
  formulaText: "(subject - reference population mean) / reference population std",
  interpretation: "Positive values are above the reference population mean; negative values are below it.",
  requirements: [
    "Subject value network",
    "Reference population mean network",
    "Reference population std network",
  ],
  requiredInputs: [
    { role: "subjectValue", label: "Subject value", kind: "subject", statisticId: "value", sourceLevel: "subject", required: true },
    { role: "referenceMean", label: "Reference mean", kind: "population", statisticId: "mean", sourceLevel: "population", required: true },
    { role: "referenceStd", label: "Reference std", kind: "population", statisticId: "std", sourceLevel: "population", required: true },
  ],
  outputs: [
    {
      statisticId: "zscore",
      statLabel: "z-score",
      statCategory: "comparison",
      operator: "zscore",
      comparisonType: "subject_vs_population",
      labelSuffix: "z-score",
      units: "z-score",
      scaleType: "diverging",
      center: 0,
      rangeMode: "observed_symmetric",
      useDataRange: true,
    },
  ],
  requiresControlOrReference: true,
  warnings: ["Cells with non-finite values or zero reference std are returned as null."],
};

const subjectZScoreOutput = subjectZScoreVsPopulationDefinition.outputs[0];

export const calculateSubjectZScoreVsPopulation: NetworkCalculationMethod["calculate"] = ({
  request,
  state,
  result,
  existingIds,
}) => {
  request.subjectIds?.forEach((subjectId) => {
    request.dimensionPairs.forEach((dimensionPair) => {
      request.measureIds.forEach((measureId) => {
        const resolved = ensureReady(
          "subject_zscore_vs_population",
          dimensionPair,
          measureId,
          result.skipped,
          request,
          state,
          subjectId,
        );
        if (!resolved) return;
        result.warnings.push(...resolved.warnings);
        const subjectValue = resolved.networks.subjectValue!;
        const referenceMean = resolved.networks.referenceMean!;
        const referenceStd = resolved.networks.referenceStd!;
        const data = createBinaryData(subjectValue, (i, j) => {
          const value = getFiniteMatrixValueOrNull(subjectValue, i, j);
          const mean = getFiniteMatrixValueOrNull(referenceMean, i, j);
          const std = getFiniteMatrixValueOrNull(referenceStd, i, j);
          if (value === null || mean === null || std === null) return null;
          return divideOrNull(value - mean, std);
        });
        maybePush(
          createComparisonNetwork({
            runtime: { state, request, existingIds },
            method: subjectZScoreVsPopulationDefinition,
            output: subjectZScoreOutput,
            endpoints: {
              left: { type: "subject", subjectId, network: subjectValue },
              right: { type: "population", populationId: request.referencePopulationId, network: referenceMean },
            },
            dependencies: [subjectValue.id, referenceMean.id, referenceStd.id],
            calculation: {
              data,
              statMethod: "subject_vs_population",
              formula: "(subject - reference_population_mean) / reference_population_std",
              statParameters: { epsilon: EPSILON },
              comparisonParameters: {
                subjectValueNetworkId: subjectValue.id,
                referenceMeanNetworkId: referenceMean.id,
                referenceStdNetworkId: referenceStd.id,
                epsilon: EPSILON,
              },
              provenanceExtra: { epsilon: EPSILON },
            },
          }),
          state,
          result,
        );
      });
    });
  });
};

export const subjectZScoreVsPopulation: NetworkCalculationMethod = {
  definition: subjectZScoreVsPopulationDefinition,
  calculate: calculateSubjectZScoreVsPopulation,
};
