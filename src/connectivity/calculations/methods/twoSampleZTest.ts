import type { MatrixCalculationMethodDefinition } from "@/connectivity/calculations/types";

export const twoSampleZTest: MatrixCalculationMethodDefinition = {
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
    { statId: "z_value", operator: "two_sample_z_test", comparisonType: "population_vs_population", labelSuffix: "two-sample Z", units: "z", scaleType: "diverging", center: 0, rangeMode: "observed_symmetric" },
  ],
  associatedOutputs: [
    {
      id: "two_sample_z_p_value",
      label: "Also compute two-sided Z-test p-value",
      description: "Computes a two-sided p-value from the normal CDF.",
      defaultEnabled: false,
      outputs: [{ statId: "p_value", operator: "two_sample_z_p_value", comparisonType: "population_vs_population", labelSuffix: "Z-test p-value", units: "p-value", scaleType: "sequential", center: null, rangeMode: "fixed" }],
    },
  ],
  requiresControlOrReference: true,
  recommendedUse: "Use when the normal approximation is justified.",
  warnings: ["For small n, unequal n, or unequal variances, Welch t-test is usually preferred."],
};
