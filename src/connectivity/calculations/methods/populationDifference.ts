import type { MatrixCalculationMethodDefinition } from "@/connectivity/calculations/types";

export const populationDifference: MatrixCalculationMethodDefinition = {
  id: "population_difference",
  label: "Difference between population means",
  shortLabel: "Difference",
  scope: "population_vs_population",
  category: "group_comparison",
  description: "Subtracts the right population mean from the left population mean.",
  formulaText: "left mean - right mean",
  interpretation: "Positive values indicate higher mean connectivity in the left population.",
  requirements: ["Left population mean matrix", "Right population mean matrix"],
  requiredInputs: [
    { role: "leftMean", label: "Left mean", kind: "aggregate", statId: "mean", sourceLevel: "population", required: true },
    { role: "rightMean", label: "Right mean", kind: "aggregate", statId: "mean", sourceLevel: "population", required: true },
  ],
  outputs: [
    {
      statId: "difference",
      operator: "difference",
      comparisonType: "population_vs_population",
      labelSuffix: "difference",
      units: null,
      scaleType: "diverging",
      center: 0,
      rangeMode: "observed_symmetric",
    },
  ],
  requiresControlOrReference: true,
};
