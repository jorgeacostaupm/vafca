import { createComparisonNetwork } from "@/networkDerivation/calculations/comparisonNetworkRecord";
import {
  computePooledStd,
  divideOrNull,
  getFiniteMatrixValueOrNull,
} from "@/networkDerivation/calculations/matrixMath";
import {
  alternative,
  createBinaryData,
  ensureReady,
  maybePush,
  resolvePopulationSampleSizesOrSkip,
} from "@/networkDerivation/calculations/methodRuntime";
import { twoSidedStudentTPValue } from "@/networkDerivation/calculations/statistics";
import type {
  NetworkCalculationMethod,
  NetworkCalculationMethodDefinition,
} from "@/networkDerivation/calculations/types";
import { EPSILON } from "@/networkDerivation/calculations/types";
import type { MatrixCellValue } from "@/types/network";

export const calculateStudentTFromCohensD = (
  cohensDData: MatrixCellValue[][],
  params: { nLeft: number; nRight: number },
) => {
  const denominator = Math.sqrt(1 / params.nLeft + 1 / params.nRight);
  return cohensDData.map((row) =>
    row.map((value) =>
      typeof value === "number" && Number.isFinite(value)
        ? divideOrNull(value, denominator)
        : null,
    ),
  );
};

export const calculateStudentPValueFromCohensD = (
  tData: MatrixCellValue[][],
  params: { df: number },
) =>
  tData.map((row) =>
    row.map((value) =>
      typeof value === "number" && Number.isFinite(value)
        ? twoSidedStudentTPValue(value, params.df)
        : null,
    ),
  );

export const populationCohensDDefinition: NetworkCalculationMethodDefinition = {
  id: "population_cohens_d",
  label: "Cohen's d between populations",
  shortLabel: "Cohen's d",
  scope: "population_vs_population",
  category: "effect_size",
  description: "Computes standardized mean difference using the pooled standard deviation.",
  formulaText: "(left mean - right mean) / pooled std",
  interpretation: "The sign follows left minus right; magnitude is expressed in pooled standard deviations.",
  requirements: [
    "Left and right population mean networks",
    "Left and right population std networks",
    "n_left > 1 and n_right > 1",
  ],
  requiredInputs: [
    { role: "leftMean", label: "Left mean", kind: "population", statId: "mean", sourceLevel: "population", required: true },
    { role: "rightMean", label: "Right mean", kind: "population", statId: "mean", sourceLevel: "population", required: true },
    { role: "leftStd", label: "Left std", kind: "population", statId: "std", sourceLevel: "population", required: true },
    { role: "rightStd", label: "Right std", kind: "population", statId: "std", sourceLevel: "population", required: true },
  ],
  outputs: [
    {
      statId: "cohens_d",
      statLabel: "Cohen's d",
      statCategory: "comparison",
      operator: "cohens_d",
      comparisonType: "population_vs_population",
      labelSuffix: "Cohen's d",
      units: "standardized mean difference",
      scaleType: "diverging",
      center: 0,
      rangeMode: "observed_symmetric",
      useDataRange: true,
    },
  ],
  associatedOutputs: [
    {
      id: "student_t_from_cohens_d",
      label: "Also compute Student t associated with Cohen's d",
      description: "Computes the pooled-variance Student t statistic equivalent to the effect size.",
      defaultEnabled: false,
      outputs: [{ statId: "t_value", statLabel: "t value", statCategory: "comparison", operator: "student_t_from_cohens_d", comparisonType: "population_vs_population", labelSuffix: "Student t", units: "t", scaleType: "diverging", center: 0, rangeMode: "observed_symmetric", useDataRange: true }],
    },
    {
      id: "student_p_value_from_cohens_d",
      label: "Also compute two-sided p-value associated with Cohen's d",
      description: "Computes the two-sided p-value of the equivalent pooled-variance Student t-test.",
      defaultEnabled: false,
      outputs: [{ statId: "p_value", statLabel: "p-value", statCategory: "comparison", operator: "student_p_from_cohens_d", comparisonType: "population_vs_population", labelSuffix: "Student p-value", units: "p-value", scaleType: "sequential", center: null, rangeMode: "fixed", expectedRange: [0, 1] }],
    },
  ],
  requiresControlOrReference: true,
  assumptions: ["Independent samples", "Pooled variance assumption for associated t and p outputs"],
  warnings: ["Cohen's d is an effect size, not a hypothesis test."],
};

const cohensDOutput = populationCohensDDefinition.outputs[0];
const studentTOutput = populationCohensDDefinition.associatedOutputs![0].outputs[0];
const studentPOutput = populationCohensDDefinition.associatedOutputs![1].outputs[0];

export const calculatePopulationCohensD: NetworkCalculationMethod["calculate"] = ({
  request,
  state,
  result,
  existingIds,
}) => {
  request.layerIds.forEach((layerId) => {
    request.measureIds.forEach((measureId) => {
      const resolved = ensureReady(
        "population_cohens_d",
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
      const n = resolvePopulationSampleSizesOrSkip(
        "population_cohens_d",
        layerId,
        measureId,
        request,
        state,
        leftMean,
        rightMean,
        result.skipped,
      );
      if (!n) return;
      const leftStd = resolved.networks.leftStd!;
      const rightStd = resolved.networks.rightStd!;
      const data = createBinaryData(leftMean, (i, j) => {
        const left = getFiniteMatrixValueOrNull(leftMean, i, j);
        const right = getFiniteMatrixValueOrNull(rightMean, i, j);
        const stdLeft = getFiniteMatrixValueOrNull(leftStd, i, j);
        const stdRight = getFiniteMatrixValueOrNull(rightStd, i, j);
        if (left === null || right === null || stdLeft === null || stdRight === null) return null;
        const pooled = computePooledStd(stdLeft, stdRight, n.nLeft, n.nRight);
        return pooled === null ? null : divideOrNull(left - right, pooled);
      });
      const dependencies = [leftMean.id, rightMean.id, leftStd.id, rightStd.id];
      const runtime = { state, request, existingIds };
      const endpoints = {
        left: { type: "population" as const, populationId: request.leftPopulationId, network: leftMean, n: n.nLeft },
        right: { type: "population" as const, populationId: request.rightPopulationId, network: rightMean, n: n.nRight },
      };
      maybePush(
        createComparisonNetwork({
          runtime,
          method: populationCohensDDefinition,
          output: cohensDOutput,
          endpoints,
          dependencies,
          calculation: {
            data,
            statMethod: "pooled_standard_deviation",
            formula: "(left_mean - right_mean) / pooled_std",
            statParameters: { epsilon: EPSILON },
            comparisonParameters: {
              leftMeanNetworkId: leftMean.id,
              rightMeanNetworkId: rightMean.id,
              leftStdNetworkId: leftStd.id,
              rightStdNetworkId: rightStd.id,
              epsilon: EPSILON,
            },
            provenanceExtra: { epsilon: EPSILON, nLeft: n.nLeft, nRight: n.nRight, alternative },
          },
        }),
        state,
        result,
      );

      const selected = request.selectedAssociatedOutputs?.population_cohens_d ?? [];
      const needsT =
        selected.includes("student_t_from_cohens_d") ||
        selected.includes("student_p_value_from_cohens_d");
      const tData = needsT ? calculateStudentTFromCohensD(data, n) : null;
      const df = n.nLeft + n.nRight - 2;
      if (tData && selected.includes("student_t_from_cohens_d")) {
        maybePush(
          createComparisonNetwork({
            runtime,
            method: populationCohensDDefinition,
            output: studentTOutput,
            endpoints,
            dependencies,
            calculation: {
              data: tData,
              statMethod: "student_from_cohens_d",
              formula: "d / sqrt(1/n_left + 1/n_right)",
              statParameters: { df },
              comparisonParameters: { df, epsilon: EPSILON },
              provenanceExtra: { df, nLeft: n.nLeft, nRight: n.nRight },
            },
          }),
          state,
          result,
        );
      }
      if (tData && selected.includes("student_p_value_from_cohens_d")) {
        const pData = calculateStudentPValueFromCohensD(tData, { df });
        maybePush(
          createComparisonNetwork({
            runtime,
            method: populationCohensDDefinition,
            output: studentPOutput,
            endpoints,
            dependencies,
            calculation: {
              data: pData,
              statMethod: "student_from_cohens_d_two_sided",
              formula: "2 * (1 - studentTCdf(abs(t), df))",
              statParameters: { df, alternative },
              comparisonParameters: { df, alternative },
              provenanceExtra: { df, nLeft: n.nLeft, nRight: n.nRight, alternative },
            },
          }),
          state,
          result,
        );
      }
    });
  });
};

export const populationCohensD: NetworkCalculationMethod = {
  definition: populationCohensDDefinition,
  calculate: calculatePopulationCohensD,
};
