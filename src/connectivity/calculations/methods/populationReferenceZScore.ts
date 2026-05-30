import { EPSILON } from "@/connectivity/calculations/types";
import {
  createBinaryData,
  ensureReady,
  maybePush,
} from "@/connectivity/calculations/methodRuntime";
import { createComparisonMatrix } from "@/connectivity/calculations/comparisonMatrixRecord";
import { divideOrNull, getFiniteMatrixValueOrNull } from "@/connectivity/calculations/matrixMath";
import type {
  MatrixCalculationMethod,
  MatrixCalculationMethodDefinition,
} from "@/connectivity/calculations/types";

export const populationReferenceZScoreDefinition: MatrixCalculationMethodDefinition = {
  id: "population_reference_zscore",
  label: "Population vs reference population z-score",
  shortLabel: "Reference z-score",
  scope: "population_vs_population",
  category: "descriptive_standardization",
  description: "Standardizes a target population mean against a reference population distribution.",
  formulaText: "(target mean - reference mean) / reference std",
  interpretation: "The sign follows target minus reference; swapping populations changes the sign and meaning.",
  requirements: [
    "Target population mean matrix",
    "Reference population mean matrix",
    "Reference population std matrix",
  ],
  requiredInputs: [
    { role: "targetMean", label: "Target mean", kind: "aggregate", statId: "mean", sourceLevel: "population", required: true },
    { role: "referenceMean", label: "Reference mean", kind: "aggregate", statId: "mean", sourceLevel: "population", required: true },
    { role: "referenceStd", label: "Reference std", kind: "aggregate", statId: "std", sourceLevel: "population", required: true },
  ],
  outputs: [
    {
      statId: "zscore",
      statLabel: "z-score",
      statCategory: "comparison",
      operator: "reference_zscore",
      comparisonType: "population_vs_reference_population",
      labelSuffix: "reference z-score",
      units: "z-score",
      scaleType: "diverging",
      center: 0,
      rangeMode: "observed_symmetric",
      useDataRange: true,
    },
  ],
  requiresControlOrReference: true,
  warnings: ["Uses the reference population std, not pooled std."],
};

const referenceZScoreOutput = populationReferenceZScoreDefinition.outputs[0];

export const calculatePopulationReferenceZScore: MatrixCalculationMethod["calculate"] = ({
  request,
  state,
  result,
  existingIds,
}) => {
  request.layerIds.forEach((layerId) => {
    request.measureIds.forEach((measureId) => {
      const resolved = ensureReady(
        "population_reference_zscore",
        layerId,
        measureId,
        result.skipped,
        request,
        state,
      );
      if (!resolved) return;
      result.warnings.push(...resolved.warnings);
      const targetMean = resolved.matrices.targetMean!;
      const referenceMean = resolved.matrices.referenceMean!;
      const referenceStd = resolved.matrices.referenceStd!;
      const data = createBinaryData(targetMean, (i, j) => {
        const left = getFiniteMatrixValueOrNull(targetMean, i, j);
        const right = getFiniteMatrixValueOrNull(referenceMean, i, j);
        const std = getFiniteMatrixValueOrNull(referenceStd, i, j);
        if (left === null || right === null || std === null) return null;
        return divideOrNull(left - right, std);
      });
      maybePush(
        createComparisonMatrix({
          runtime: { state, request, existingIds },
          method: populationReferenceZScoreDefinition,
          output: referenceZScoreOutput,
          endpoints: {
            left: { type: "population", populationId: request.leftPopulationId, matrix: targetMean },
            right: { type: "population", populationId: request.referencePopulationId, matrix: referenceMean },
          },
          dependencies: [targetMean.id, referenceMean.id, referenceStd.id],
          calculation: {
            data,
            statMethod: "population_reference",
            formula: "(target_mean - reference_mean) / reference_std",
            statParameters: { epsilon: EPSILON },
            comparisonParameters: {
              referenceStdMatrixId: referenceStd.id,
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
};

export const populationReferenceZScore: MatrixCalculationMethod = {
  definition: populationReferenceZScoreDefinition,
  calculate: calculatePopulationReferenceZScore,
};
