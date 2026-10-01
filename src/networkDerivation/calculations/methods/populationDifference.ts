import { createComparisonNetwork } from "@/networkDerivation/calculations/comparisonNetworkRecord";
import { getFiniteMatrixValueOrNull } from "@/networkDerivation/calculations/matrixMath";
import {
  createBinaryData,
  ensureReady,
  maybePush,
} from "@/networkDerivation/calculations/methodRuntime";
import type {
  NetworkCalculationMethod,
  NetworkCalculationMethodDefinition,
} from "@/networkDerivation/calculations/types";

export const populationDifferenceDefinition: NetworkCalculationMethodDefinition = {
  id: "population_difference",
  label: "Difference between populations",
  shortLabel: "Difference",
  scope: "population_vs_population",
  category: "group_comparison",
  description: "Subtracts the selected right population statistic from the selected left population statistic.",
  formulaText: "left value - right value",
  interpretation: "Positive values indicate a higher selected statistic in the left population.",
  requirements: ["Left population network", "Right population network"],
  requiredInputs: [
    { role: "leftValue", label: "Left statistic", kind: "population", statisticId: "mean", sourceLevel: "population", required: true },
    { role: "rightValue", label: "Right statistic", kind: "population", statisticId: "mean", sourceLevel: "population", required: true },
  ],
  outputs: [
    {
      statisticId: "difference",
      statLabel: "Difference",
      statCategory: "comparison",
      operator: "difference",
      comparisonType: "population_vs_population",
      labelSuffix: "difference",
      units: null,
      scaleType: "diverging",
      center: 0,
      rangeMode: "observed_symmetric",
      expectedRange: null,
      useDataRange: true,
    },
  ],
  requiresControlOrReference: true,
};

const differenceOutput = populationDifferenceDefinition.outputs[0];

export const calculatePopulationDifference: NetworkCalculationMethod["calculate"] = ({
  request,
  state,
  result,
  existingIds,
}) => {
  request.dimensionPairs.forEach((dimensionPair) => {
    request.measureIds.forEach((measureId) => {
      const resolved = ensureReady(
        "population_difference",
        dimensionPair,
        measureId,
        result.skipped,
        request,
        state,
      );
      if (!resolved) return;
      result.warnings.push(...resolved.warnings);
      const leftValue = resolved.networks.leftValue!;
      const rightValue = resolved.networks.rightValue!;
      const data = createBinaryData(leftValue, (i, j) => {
        const left = getFiniteMatrixValueOrNull(leftValue, i, j);
        const right = getFiniteMatrixValueOrNull(rightValue, i, j);
        return left === null || right === null ? null : left - right;
      });
      maybePush(
        createComparisonNetwork({
          runtime: { state, request, existingIds },
          method: populationDifferenceDefinition,
          output: differenceOutput,
          endpoints: {
            left: { type: "population", populationId: request.leftPopulationId, network: leftValue },
            right: { type: "population", populationId: request.rightPopulationId, network: rightValue },
          },
          dependencies: [leftValue.id, rightValue.id],
          calculation: {
            data,
            statMethod: "left_minus_right",
            formula: "left_value - right_value",
            comparisonParameters: {
              leftValueNetworkId: leftValue.id,
              rightValueNetworkId: rightValue.id,
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

export const populationDifference: NetworkCalculationMethod = {
  definition: populationDifferenceDefinition,
  calculate: calculatePopulationDifference,
};
