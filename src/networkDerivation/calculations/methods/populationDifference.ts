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
  label: "Difference between population means",
  shortLabel: "Difference",
  scope: "population_vs_population",
  category: "group_comparison",
  description: "Subtracts the right population mean from the left population mean.",
  formulaText: "left mean - right mean",
  interpretation: "Positive values indicate higher mean connectivity in the left population.",
  requirements: ["Left population mean network", "Right population mean network"],
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

export const calculatePopulationDifference: NetworkCalculationMethod["calculate"] = ({
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
      const leftMean = resolved.networks.leftMean!;
      const rightMean = resolved.networks.rightMean!;
      const data = createBinaryData(leftMean, (i, j) => {
        const left = getFiniteMatrixValueOrNull(leftMean, i, j);
        const right = getFiniteMatrixValueOrNull(rightMean, i, j);
        return left === null || right === null ? null : left - right;
      });
      maybePush(
        createComparisonNetwork({
          runtime: { state, request, existingIds },
          method: populationDifferenceDefinition,
          output: differenceOutput,
          endpoints: {
            left: { type: "population", populationId: request.leftPopulationId, network: leftMean },
            right: { type: "population", populationId: request.rightPopulationId, network: rightMean },
          },
          dependencies: [leftMean.id, rightMean.id],
          calculation: {
            data,
            statMethod: "left_minus_right",
            formula: "left_mean - right_mean",
            comparisonParameters: {
              leftMeanNetworkId: leftMean.id,
              rightMeanNetworkId: rightMean.id,
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
