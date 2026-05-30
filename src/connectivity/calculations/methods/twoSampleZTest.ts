import { EPSILON } from "@/connectivity/calculations/types";
import {
  alternative,
  createBinaryData,
  ensureReady,
  maybePush,
  resolvePopulationSampleSizesOrSkip,
} from "@/connectivity/calculations/methodRuntime";
import { createComparisonMatrix } from "@/connectivity/calculations/comparisonMatrixRecord";
import { divideOrNull, getFiniteMatrixValueOrNull } from "@/connectivity/calculations/matrixMath";
import { twoSidedNormalPValue } from "@/connectivity/calculations/statistics";
import type {
  MatrixCalculationMethod,
  MatrixCalculationMethodDefinition,
} from "@/connectivity/calculations/types";
import type { MatrixCellValue } from "@/types/connectivityBundle";

export const calculatePopulationTwoSampleZPValue = (zData: MatrixCellValue[][]) =>
  zData.map((row) =>
    row.map((value) =>
      typeof value === "number" && Number.isFinite(value)
        ? twoSidedNormalPValue(value)
        : null,
    ),
  );

export const twoSampleZTestDefinition: MatrixCalculationMethodDefinition = {
  id: "population_two_sample_z_test",
  label: "Two-sample Z test",
  shortLabel: "Z test",
  scope: "population_vs_population",
  category: "parametric_test",
  description: "Computes a normal-approximation Z statistic for the difference between two population means.",
  formulaText: "((left mean - right mean) - hypothesized difference) / sqrt(std_left^2 / n_left + std_right^2 / n_right)",
  interpretation: "The sign follows left minus right after subtracting the hypothesized difference.",
  requirements: [
    "Left and right population mean matrices",
    "Left and right population std matrices",
    "n_left > 1 and n_right > 1",
  ],
  requiredInputs: [
    { role: "leftMean", label: "Left mean", kind: "aggregate", statId: "mean", sourceLevel: "population", required: true },
    { role: "rightMean", label: "Right mean", kind: "aggregate", statId: "mean", sourceLevel: "population", required: true },
    { role: "leftStd", label: "Left std", kind: "aggregate", statId: "std", sourceLevel: "population", required: true },
    { role: "rightStd", label: "Right std", kind: "aggregate", statId: "std", sourceLevel: "population", required: true },
  ],
  outputs: [
    { statId: "z_value", statLabel: "Z value", statCategory: "comparison", operator: "two_sample_z_test", comparisonType: "population_vs_population", labelSuffix: "two-sample Z", units: "z", scaleType: "diverging", center: 0, rangeMode: "observed_symmetric", useDataRange: true },
  ],
  associatedOutputs: [
    {
      id: "two_sample_z_p_value",
      label: "Also compute two-sided Z-test p-value",
      description: "Computes a two-sided p-value from the normal CDF.",
      defaultEnabled: false,
      outputs: [{ statId: "p_value", statLabel: "p-value", statCategory: "comparison", operator: "two_sample_z_p_value", comparisonType: "population_vs_population", labelSuffix: "Z-test p-value", units: "p-value", scaleType: "sequential", center: null, rangeMode: "fixed", expectedRange: [0, 1] }],
    },
  ],
  requiresControlOrReference: true,
  recommendedUse: "Use when the normal approximation is justified.",
  warnings: ["For small n, unequal n, or unequal variances, Welch t-test is usually preferred."],
};

const twoSampleZOutput = twoSampleZTestDefinition.outputs[0];
const twoSampleZPValueOutput = twoSampleZTestDefinition.associatedOutputs![0].outputs[0];

export const calculatePopulationTwoSampleZTest: MatrixCalculationMethod["calculate"] = ({
  request,
  state,
  result,
  existingIds,
}) => {
  request.layerIds.forEach((layerId) => {
    request.measureIds.forEach((measureId) => {
      const resolved = ensureReady(
        "population_two_sample_z_test",
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
      const n = resolvePopulationSampleSizesOrSkip(
        "population_two_sample_z_test",
        layerId,
        measureId,
        request,
        state,
        leftMean,
        rightMean,
        result.skipped,
      );
      if (!n) return;
      const leftStd = resolved.matrices.leftStd!;
      const rightStd = resolved.matrices.rightStd!;
      const hypothesizedDifference = request.hypothesizedDifference ?? 0;
      const data = createBinaryData(leftMean, (i, j) => {
        const left = getFiniteMatrixValueOrNull(leftMean, i, j);
        const right = getFiniteMatrixValueOrNull(rightMean, i, j);
        const stdLeft = getFiniteMatrixValueOrNull(leftStd, i, j);
        const stdRight = getFiniteMatrixValueOrNull(rightStd, i, j);
        if (left === null || right === null || stdLeft === null || stdRight === null) return null;
        const se = Math.sqrt((stdLeft * stdLeft) / n.nLeft + (stdRight * stdRight) / n.nRight);
        return divideOrNull(left - right - hypothesizedDifference, se);
      });
      const dependencies = [leftMean.id, rightMean.id, leftStd.id, rightStd.id];
      const runtime = { state, request, existingIds };
      const endpoints = {
        left: { type: "population" as const, populationId: request.leftPopulationId, matrix: leftMean, n: n.nLeft },
        right: { type: "population" as const, populationId: request.rightPopulationId, matrix: rightMean, n: n.nRight },
      };
      maybePush(
        createComparisonMatrix({
          runtime,
          method: twoSampleZTestDefinition,
          output: twoSampleZOutput,
          endpoints,
          dependencies,
          calculation: {
            data,
            statMethod: "two_sample_z_test",
            formula: "((left_mean - right_mean) - hypothesized_difference) / standard_error",
            statParameters: { hypothesizedDifference, epsilon: EPSILON },
            comparisonParameters: { hypothesizedDifference, epsilon: EPSILON },
            provenanceExtra: {
              hypothesizedDifference,
              epsilon: EPSILON,
              nLeft: n.nLeft,
              nRight: n.nRight,
              alternative,
            },
          },
        }),
        state,
        result,
      );
      if (request.selectedAssociatedOutputs?.population_two_sample_z_test?.includes("two_sample_z_p_value")) {
        maybePush(
          createComparisonMatrix({
            runtime,
            method: twoSampleZTestDefinition,
            output: twoSampleZPValueOutput,
            endpoints,
            dependencies,
            calculation: {
              data: calculatePopulationTwoSampleZPValue(data),
              statMethod: "two_sample_z_test_two_sided",
              formula: "2 * (1 - normalCdf(abs(z)))",
              statParameters: { hypothesizedDifference, alternative },
              comparisonParameters: { hypothesizedDifference, alternative },
              provenanceExtra: { hypothesizedDifference, nLeft: n.nLeft, nRight: n.nRight, alternative },
            },
          }),
          state,
          result,
        );
      }
    });
  });
};

export const twoSampleZTest: MatrixCalculationMethod = {
  definition: twoSampleZTestDefinition,
  calculate: calculatePopulationTwoSampleZTest,
};
