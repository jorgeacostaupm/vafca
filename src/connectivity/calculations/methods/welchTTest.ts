import type { MatrixCalculationMethodDefinition } from "@/connectivity/calculations/types";

export const welchTTest: MatrixCalculationMethodDefinition = {
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
    { statId: "t_value", operator: "welch_t", comparisonType: "population_vs_population", labelSuffix: "Welch t", units: "t", scaleType: "diverging", center: 0, rangeMode: "observed_symmetric" },
  ],
  associatedOutputs: [
    {
      id: "welch_p_value",
      label: "Also compute two-sided Welch p-value",
      description: "Computes a two-sided p-value using the Student t CDF and per-cell Welch df.",
      defaultEnabled: false,
      outputs: [{ statId: "p_value", operator: "welch_p_value", comparisonType: "population_vs_population", labelSuffix: "Welch p-value", units: "p-value", scaleType: "sequential", center: null, rangeMode: "fixed" }],
    },
  ],
  requiresControlOrReference: true,
  recommendedUse: "Recommended when n is small, n differs, or variances may differ.",
};
