import type { MatrixCalculationMethodDefinition } from "@/connectivity/calculations/types";

export const subjectZScoreVsPopulation: MatrixCalculationMethodDefinition = {
  id: "subject_zscore_vs_population",
  label: "Subject vs reference population z-score",
  shortLabel: "Subject z-score",
  scope: "subject_vs_population",
  category: "descriptive_standardization",
  description: "Standardizes a subject matrix against a reference population mean and standard deviation.",
  formulaText: "(subject - reference population mean) / reference population std",
  interpretation: "Positive values are above the reference population mean; negative values are below it.",
  requirements: [
    "Subject value matrix",
    "Reference population mean matrix",
    "Reference population std matrix",
  ],
  requiredInputs: [
    { role: "subjectValue", label: "Subject value", kind: "subject", statId: "value", sourceLevel: "subject", required: true },
    { role: "referenceMean", label: "Reference mean", kind: "aggregate", statId: "mean", sourceLevel: "population", required: true },
    { role: "referenceStd", label: "Reference std", kind: "aggregate", statId: "std", sourceLevel: "population", required: true },
  ],
  outputs: [
    {
      statId: "zscore",
      operator: "zscore",
      comparisonType: "subject_vs_population",
      labelSuffix: "z-score",
      units: "z-score",
      scaleType: "diverging",
      center: 0,
      rangeMode: "observed_symmetric",
    },
  ],
  requiresControlOrReference: true,
  warnings: ["Cells with non-finite values or zero reference std are returned as null."],
};
