import { EPSILON } from "@/connectivity/calculations/types";
import {
  alternative,
  createBinaryData,
  ensureReady,
  maybePush,
  resolvePopulationSampleSizesOrSkip,
} from "@/connectivity/calculations/methodRuntime";
import { createComparisonMatrix } from "@/connectivity/calculations/comparisonMatrixRecord";
import {
  computeWelchDf,
  divideOrNull,
  getFiniteMatrixValueOrNull,
} from "@/connectivity/calculations/matrixMath";
import { twoSidedStudentTPValue } from "@/connectivity/calculations/statistics";
import type {
  MatrixCalculationMethod,
  MatrixCalculationMethodDefinition,
} from "@/connectivity/calculations/types";
import type { MatrixCellValue } from "@/types/connectivityBundle";

export const calculatePopulationWelchPValue = (
  tData: MatrixCellValue[][],
  dfData: MatrixCellValue[][],
) =>
  tData.map((row, i) =>
    row.map((value, j) => {
      const df = dfData[i][j];
      return typeof value === "number" &&
        Number.isFinite(value) &&
        typeof df === "number" &&
        Number.isFinite(df) &&
        df > 0
        ? twoSidedStudentTPValue(value, df)
        : null;
    }),
  );

export const welchTTestDefinition: MatrixCalculationMethodDefinition = {
  id: "population_welch_t",
  label: "Welch t-test",
  shortLabel: "Welch t",
  scope: "population_vs_population",
  category: "parametric_test",
  description: "Computes Welch's t statistic without assuming equal variances.",
  formulaText: "(left mean - right mean) / sqrt(std_left^2 / n_left + std_right^2 / n_right)",
  interpretation: "The sign follows left minus right; p-values use per-cell Welch-Satterthwaite df.",
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
    { statId: "t_value", statLabel: "t value", statCategory: "comparison", operator: "welch_t", comparisonType: "population_vs_population", labelSuffix: "Welch t", units: "t", scaleType: "diverging", center: 0, rangeMode: "observed_symmetric", useDataRange: true },
  ],
  associatedOutputs: [
    {
      id: "welch_p_value",
      label: "Also compute two-sided Welch p-value",
      description: "Computes a two-sided p-value using the Student t CDF and per-cell Welch df.",
      defaultEnabled: false,
      outputs: [{ statId: "p_value", statLabel: "p-value", statCategory: "comparison", operator: "welch_p_value", comparisonType: "population_vs_population", labelSuffix: "Welch p-value", units: "p-value", scaleType: "sequential", center: null, rangeMode: "fixed", expectedRange: [0, 1] }],
    },
  ],
  requiresControlOrReference: true,
  recommendedUse: "Recommended when n is small, n differs, or variances may differ.",
};

const welchTOutput = welchTTestDefinition.outputs[0];
const welchPValueOutput = welchTTestDefinition.associatedOutputs![0].outputs[0];

export const calculatePopulationWelchT: MatrixCalculationMethod["calculate"] = ({
  request,
  state,
  result,
  existingIds,
}) => {
  request.layerIds.forEach((layerId) => {
    request.measureIds.forEach((measureId) => {
      const resolved = ensureReady(
        "population_welch_t",
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
        "population_welch_t",
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
      const dfData = createBinaryData(leftMean, (i, j) => {
        const stdLeft = getFiniteMatrixValueOrNull(leftStd, i, j);
        const stdRight = getFiniteMatrixValueOrNull(rightStd, i, j);
        if (stdLeft === null || stdRight === null) return null;
        return computeWelchDf(stdLeft, stdRight, n.nLeft, n.nRight);
      });
      const data = createBinaryData(leftMean, (i, j) => {
        const left = getFiniteMatrixValueOrNull(leftMean, i, j);
        const right = getFiniteMatrixValueOrNull(rightMean, i, j);
        const stdLeft = getFiniteMatrixValueOrNull(leftStd, i, j);
        const stdRight = getFiniteMatrixValueOrNull(rightStd, i, j);
        if (left === null || right === null || stdLeft === null || stdRight === null) return null;
        const se = Math.sqrt((stdLeft * stdLeft) / n.nLeft + (stdRight * stdRight) / n.nRight);
        return divideOrNull(left - right, se);
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
          method: welchTTestDefinition,
          output: welchTOutput,
          endpoints,
          dependencies,
          calculation: {
            data,
            statMethod: "welch",
            formula: "(left_mean - right_mean) / standard_error",
            statParameters: { epsilon: EPSILON },
            comparisonParameters: { epsilon: EPSILON },
            provenanceExtra: { epsilon: EPSILON, nLeft: n.nLeft, nRight: n.nRight, alternative },
          },
        }),
        state,
        result,
      );
      if (request.selectedAssociatedOutputs?.population_welch_t?.includes("welch_p_value")) {
        maybePush(
          createComparisonMatrix({
            runtime,
            method: welchTTestDefinition,
            output: welchPValueOutput,
            endpoints,
            dependencies,
            calculation: {
              data: calculatePopulationWelchPValue(data, dfData),
              statMethod: "welch_two_sided",
              formula: "2 * (1 - studentTCdf(abs(t), welch_df))",
              statParameters: { epsilon: EPSILON, alternative },
              comparisonParameters: { epsilon: EPSILON, alternative },
              provenanceExtra: { epsilon: EPSILON, nLeft: n.nLeft, nRight: n.nRight, alternative },
            },
          }),
          state,
          result,
        );
      }
    });
  });
};

export const welchTTest: MatrixCalculationMethod = {
  definition: welchTTestDefinition,
  calculate: calculatePopulationWelchT,
};
