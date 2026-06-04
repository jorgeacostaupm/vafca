import { createComparisonMatrix } from "@/networkDerivation/calculations/comparisonMatrixRecord";
import { getFiniteMatrixValueOrNull } from "@/networkDerivation/calculations/matrixMath";
import {
  createBinaryData,
  ensureReady,
  maybePush,
} from "@/networkDerivation/calculations/methodRuntime";
import type {
  MatrixCalculationMethod,
  MatrixCalculationMethodDefinition,
} from "@/networkDerivation/calculations/types";

export const populationDifferenceDefinition: MatrixCalculationMethodDefinition = {
  id: "population_difference",
  label: "Difference between population means",
  shortLabel: "Difference",
  scope: "population_vs_population",
  category: "group_comparison",
  description: "Subtracts the right population mean from the left population mean.",
  formulaText: "left mean - right mean",
  interpretation: "Positive values indicate higher mean connectivity in the left population.",
  requirements: ["Left population mean matrix", "Right population mean matrix"],
  requiredInputs: [
    { role: "leftMean", label: "Left mean", kind: "population", statId: "mean", sourceLevel: "population", required: true },
    { role: "rightMean", label: "Right mean", kind: "population", statId: "mean", sourceLevel: "population", required: true },
  ],
  outputs: [
    {
      statId: "difference",
      statLabel: "Difference",
      statCategory: "comparison",
      operator: "difference",
      comparisonType: "population_vs_population",
      labelSuffix: "difference",
      units: null,
      scaleType: "diverging",
      center: 0,
      rangeMode: "observed_symmetric",
      expectedRange: [-1, 1],
      useDataRange: true,
    },
  ],
  requiresControlOrReference: true,
};

const differenceOutput = populationDifferenceDefinition.outputs[0];

export const calculatePopulationDifference: MatrixCalculationMethod["calculate"] = ({
  request,
  state,
  result,
  existingIds,
}) => {
  request.layerIds.forEach((layerId) => {
    request.measureIds.forEach((measureId) => {
      const resolved = ensureReady(
        "population_difference",
        layerId,
        measureId,
        result.skipped,
        request,
        state,
      );
      if (!resolved) return;
      result.warnings.push(...resolved.warnings);
      const leftMean = resolved.matrices.leftMean!;
      const rightMean = resolved.matrices.rightMean!;
      const data = createBinaryData(leftMean, (i, j) => {
        const left = getFiniteMatrixValueOrNull(leftMean, i, j);
        const right = getFiniteMatrixValueOrNull(rightMean, i, j);
        return left === null || right === null ? null : left - right;
      });
      maybePush(
        createComparisonMatrix({
          runtime: { state, request, existingIds },
          method: populationDifferenceDefinition,
          output: differenceOutput,
          endpoints: {
            left: { type: "population", populationId: request.leftPopulationId, matrix: leftMean },
            right: { type: "population", populationId: request.rightPopulationId, matrix: rightMean },
          },
          dependencies: [leftMean.id, rightMean.id],
          calculation: {
            data,
            statMethod: "left_minus_right",
            formula: "left_mean - right_mean",
            comparisonParameters: {
              leftMeanMatrixId: leftMean.id,
              rightMeanMatrixId: rightMean.id,
            },
          },
          labelMode: "minus",
        }),
        state,
        result,
      );
    });
  });
};

export const populationDifference: MatrixCalculationMethod = {
  definition: populationDifferenceDefinition,
  calculate: calculatePopulationDifference,
};
