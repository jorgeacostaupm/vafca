import type { MatrixCalculationMethodDefinition } from "@/connectivity/calculations/types";

export const populationReferenceZScore: MatrixCalculationMethodDefinition = {
  id: "population_reference_zscore",
  label: "Population vs reference population z-score",
  shortLabel: "Reference z-score",
  scope: "population_vs_population",
  category: "descriptive_standardization",
  description: "Standardizes a target population mean against a reference population distribution.",
  formulaText: "(target mean - reference mean) / reference std",
  interpretation: "The sign follows target minus reference; swapping populations changes the sign and meaning.",
  requirements: [
    "Target population mean matrix",
    "Reference population mean matrix",
    "Reference population std matrix",
  ],
  requiredInputs: [
    { role: "targetMean", label: "Target mean", kind: "aggregate", statId: "mean", sourceLevel: "population", required: true },
    { role: "referenceMean", label: "Reference mean", kind: "aggregate", statId: "mean", sourceLevel: "population", required: true },
    { role: "referenceStd", label: "Reference std", kind: "aggregate", statId: "std", sourceLevel: "population", required: true },
  ],
  outputs: [
    {
      statId: "zscore",
      operator: "reference_zscore",
      comparisonType: "population_vs_reference_population",
      labelSuffix: "reference z-score",
      units: "z-score",
      scaleType: "diverging",
      center: 0,
      rangeMode: "observed_symmetric",
    },
  ],
  requiresControlOrReference: true,
  warnings: ["Uses the reference population std, not pooled std."],
};
