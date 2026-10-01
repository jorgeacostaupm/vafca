import { createComparisonNetwork } from "@/networkDerivation/calculations/comparisonNetworkRecord";
import { divideOrNull, getFiniteMatrixValueOrNull } from "@/networkDerivation/calculations/matrixMath";
import {
  createBinaryData,
  ensureReady,
  maybePush,
} from "@/networkDerivation/calculations/methodRuntime";
import { isValidSampleSize, populationSampleSize } from "@/networkDerivation/calculations/sampleSizes";
import type {
  NetworkCalculationMethod,
  NetworkCalculationMethodDefinition,
} from "@/networkDerivation/calculations/types";
import { EPSILON } from "@/networkDerivation/calculations/types";

export const populationOneSampleZScoreDefinition: NetworkCalculationMethodDefinition = {
  id: "population_one_sample_z_test",
  label: "One sample Z-score",
  shortLabel: "One sample Z-score",
  scope: "population_vs_population",
  category: "parametric_test",
  description: "Tests a sample mean against a reference mean using the known population standard deviation and the target sample size.",
  formulaText: "(sample mean - reference mean) / (known population std / sqrt(n_target))",
  interpretation: "Positive values indicate a sample mean above the reference mean. The reference mean and population standard deviation are treated as fixed.",
  requirements: [
    "Target population mean network",
    "Reference population mean network",
    "Known population standard deviation network",
    "Target sample size n > 1",
  ],
  requiredInputs: [
    { role: "targetMean", label: "Sample mean", kind: "population", statisticId: "mean", sourceLevel: "population", required: true },
    { role: "referenceMean", label: "Reference mean", kind: "population", statisticId: "mean", sourceLevel: "population", required: true },
    { role: "referenceStd", label: "Known population std", kind: "population", statisticId: "std", sourceLevel: "population", required: true },
  ],
  outputs: [
    {
      statisticId: "z_value",
      statLabel: "Z value",
      statCategory: "comparison",
      operator: "one_sample_z_test",
      comparisonType: "population_vs_reference_population",
      labelSuffix: "one-sample Z",
      units: "z-score",
      scaleType: "diverging",
      center: 0,
      rangeMode: "observed_symmetric",
      useDataRange: true,
    },
  ],
  requiresControlOrReference: true,
  assumptions: ["The reference supplies a fixed null mean and a known population standard deviation."],
};

const referenceZScoreOutput = populationOneSampleZScoreDefinition.outputs[0];

export const calculatePopulationOneSampleZScore: NetworkCalculationMethod["calculate"] = ({
  request,
  state,
  result,
  existingIds,
}) => {
  request.dimensionPairs.forEach((dimensionPair) => {
    request.measureIds.forEach((measureId) => {
      const resolved = ensureReady(
        "population_one_sample_z_test",
        dimensionPair,
        measureId,
        result.skipped,
        request,
        state,
      );
      if (!resolved) return;
      result.warnings.push(...resolved.warnings);
      const targetMean = resolved.networks.targetMean!;
      const referenceMean = resolved.networks.referenceMean!;
      const referenceStd = resolved.networks.referenceStd!;
      const n = populationSampleSize(targetMean.sourceId, request, state);
      if (!isValidSampleSize(n)) {
        result.skipped.push({ operation: "population_one_sample_z_test", dimensionPair, measureId,
          reason: "The target sample size must be an integer greater than 1." });
        return;
      }
      const data = createBinaryData(targetMean, (i, j) => {
        const left = getFiniteMatrixValueOrNull(targetMean, i, j);
        const right = getFiniteMatrixValueOrNull(referenceMean, i, j);
        const std = getFiniteMatrixValueOrNull(referenceStd, i, j);
        if (left === null || right === null || std === null) return null;
        return std > 0 ? divideOrNull(left - right, std / Math.sqrt(n)) : null;
      });
      maybePush(
        createComparisonNetwork({
          runtime: { state, request, existingIds },
          method: populationOneSampleZScoreDefinition,
          output: referenceZScoreOutput,
          endpoints: {
            left: { type: "population", populationId: request.leftPopulationId, network: targetMean, n },
            right: { type: "population", populationId: request.referencePopulationId, network: referenceMean },
          },
          dependencies: [targetMean.id, referenceMean.id, referenceStd.id],
          calculation: {
            data,
            statMethod: "one_sample_z_test",
            formula: "(sample_mean - reference_mean) / (population_std / sqrt(n_target))",
            statParameters: { nTarget: n, epsilon: EPSILON },
            comparisonParameters: {
              nTarget: n,
              referenceStdNetworkId: referenceStd.id,
              epsilon: EPSILON,
            },
            provenanceExtra: { nTarget: n, epsilon: EPSILON },
          },
        }),
        state,
        result,
      );
    });
  });
};

export const populationOneSampleZScore: NetworkCalculationMethod = {
  definition: populationOneSampleZScoreDefinition,
  calculate: calculatePopulationOneSampleZScore,
};
