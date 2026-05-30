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

export const subjectZScoreVsPopulationDefinition: MatrixCalculationMethodDefinition = {
  id: "subject_zscore_vs_population",
  label: "Subject vs reference population z-score",
  shortLabel: "Subject z-score",
  scope: "subject_vs_population",
  category: "descriptive_standardization",
  description: "Standardizes a subject matrix against a reference population mean and standard deviation.",
  formulaText: "(subject - reference population mean) / reference population std",
  interpretation: "Positive values are above the reference population mean; negative values are below it.",
  requirements: [
    "Subject value matrix",
    "Reference population mean matrix",
    "Reference population std matrix",
  ],
  requiredInputs: [
    { role: "subjectValue", label: "Subject value", kind: "subject", statId: "value", sourceLevel: "subject", required: true },
    { role: "referenceMean", label: "Reference mean", kind: "aggregate", statId: "mean", sourceLevel: "population", required: true },
    { role: "referenceStd", label: "Reference std", kind: "aggregate", statId: "std", sourceLevel: "population", required: true },
  ],
  outputs: [
    {
      statId: "zscore",
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

export const calculateSubjectZScoreVsPopulation: MatrixCalculationMethod["calculate"] = ({
  request,
  state,
  result,
  existingIds,
}) => {
  request.subjectIds?.forEach((subjectId) => {
    request.layerIds.forEach((layerId) => {
      request.measureIds.forEach((measureId) => {
        const resolved = ensureReady(
          "subject_zscore_vs_population",
          layerId,
          measureId,
          result.skipped,
          request,
          state,
          subjectId,
        );
        if (!resolved) return;
        result.warnings.push(...resolved.warnings);
        const subjectValue = resolved.matrices.subjectValue!;
        const referenceMean = resolved.matrices.referenceMean!;
        const referenceStd = resolved.matrices.referenceStd!;
        const data = createBinaryData(subjectValue, (i, j) => {
          const value = getFiniteMatrixValueOrNull(subjectValue, i, j);
          const mean = getFiniteMatrixValueOrNull(referenceMean, i, j);
          const std = getFiniteMatrixValueOrNull(referenceStd, i, j);
          if (value === null || mean === null || std === null) return null;
          return divideOrNull(value - mean, std);
        });
        maybePush(
          createComparisonMatrix({
            runtime: { state, request, existingIds },
            method: subjectZScoreVsPopulationDefinition,
            output: subjectZScoreOutput,
            endpoints: {
              left: { type: "subject", subjectId, matrix: subjectValue },
              right: { type: "population", populationId: request.referencePopulationId, matrix: referenceMean },
            },
            dependencies: [subjectValue.id, referenceMean.id, referenceStd.id],
            calculation: {
              data,
              statMethod: "subject_vs_population",
              formula: "(subject - reference_population_mean) / reference_population_std",
              statParameters: { epsilon: EPSILON },
              comparisonParameters: {
                subjectValueMatrixId: subjectValue.id,
                referenceMeanMatrixId: referenceMean.id,
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
  });
};

export const subjectZScoreVsPopulation: MatrixCalculationMethod = {
  definition: subjectZScoreVsPopulationDefinition,
  calculate: calculateSubjectZScoreVsPopulation,
};
