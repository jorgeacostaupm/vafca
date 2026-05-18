import type { MatrixCalculationMethodDefinition } from "@/connectivity/calculations/types";

export const populationCohensD: MatrixCalculationMethodDefinition = {
  id: "population_cohens_d",
  label: "Cohen's d between populations",
  shortLabel: "Cohen's d",
  scope: "population_vs_population",
  category: "effect_size",
  description: "Computes standardized mean difference using the pooled standard deviation.",
  formulaText: "(left mean - right mean) / pooled std",
  interpretation: "The sign follows left minus right; magnitude is expressed in pooled standard deviations.",
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
    {
      statId: "cohens_d",
      operator: "cohens_d",
      comparisonType: "population_vs_population",
      labelSuffix: "Cohen's d",
      units: "standardized mean difference",
      scaleType: "diverging",
      center: 0,
      rangeMode: "observed_symmetric",
    },
  ],
  associatedOutputs: [
    {
      id: "student_t_from_cohens_d",
      label: "Also compute Student t associated with Cohen's d",
      description: "Computes the pooled-variance Student t statistic equivalent to the effect size.",
      defaultEnabled: false,
      outputs: [{ statId: "t_value", operator: "student_t_from_cohens_d", comparisonType: "population_vs_population", labelSuffix: "Student t", units: "t", scaleType: "diverging", center: 0, rangeMode: "observed_symmetric" }],
    },
    {
      id: "student_p_value_from_cohens_d",
      label: "Also compute two-sided p-value associated with Cohen's d",
      description: "Computes the two-sided p-value of the equivalent pooled-variance Student t-test.",
      defaultEnabled: false,
      outputs: [{ statId: "p_value", operator: "student_p_from_cohens_d", comparisonType: "population_vs_population", labelSuffix: "Student p-value", units: "p-value", scaleType: "sequential", center: null, rangeMode: "fixed" }],
    },
  ],
  requiresControlOrReference: true,
  assumptions: ["Independent samples", "Pooled variance assumption for associated t and p outputs"],
  warnings: ["Cohen's d is an effect size, not a hypothesis test."],
};
