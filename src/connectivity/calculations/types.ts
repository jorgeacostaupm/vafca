import type { ConnectivityDataState, MatrixRecord, ScaleType } from "@/types/connectivityBundle";

export const EPSILON = 1e-12;

export type MatrixCalculationOperation =
  | "subject_zscore_vs_population"
  | "population_reference_zscore"
  | "population_difference"
  | "population_cohens_d"
  | "population_two_sample_z_test"
  | "population_welch_t";

export type MatrixCalculationAssociatedOutputId =
  | "student_t_from_cohens_d"
  | "student_p_value_from_cohens_d"
  | "two_sample_z_p_value"
  | "welch_p_value";

export type MatrixCalculationScope =
  | "subject_vs_population"
  | "population_vs_population";

export type MatrixCalculationCategory =
  | "descriptive_standardization"
  | "group_comparison"
  | "effect_size"
  | "parametric_test";

export type MatrixCalculationInputSpec = {
  role: string;
  label: string;
  kind?: "subject" | "aggregate" | "comparison";
  statId?: string;
  sourceLevel?: "subject" | "population" | "comparison";
  required: boolean;
};

export type MatrixCalculationOutputSpec = {
  statId: string;
  operator: string;
  comparisonType: string;
  labelSuffix: string;
  units: string | null;
  scaleType: ScaleType;
  center: number | null;
  rangeMode: string;
};

export type MatrixCalculationAssociatedOutputSpec = {
  id: MatrixCalculationAssociatedOutputId;
  label: string;
  description: string;
  defaultEnabled: boolean;
  outputs: MatrixCalculationOutputSpec[];
};

export type MatrixCalculationMethodDefinition = {
  id: MatrixCalculationOperation;
  label: string;
  shortLabel: string;
  scope: MatrixCalculationScope;
  category: MatrixCalculationCategory;
  description: string;
  formulaText: string;
  formulaLatex?: string;
  interpretation: string;
  requirements: string[];
  requiredInputs: MatrixCalculationInputSpec[];
  outputs: MatrixCalculationOutputSpec[];
  associatedOutputs?: MatrixCalculationAssociatedOutputSpec[];
  requiresControlOrReference: boolean;
  recommendedUse?: string;
  warnings?: string[];
  assumptions?: string[];
};

export type MatrixCalculationBatchRequest = {
  operations: MatrixCalculationOperation[];
  leftPopulationId?: string;
  rightPopulationId?: string;
  referencePopulationId?: string;
  subjectIds?: string[];
  bandIds: string[];
  measureIds: string[];
  conditionId?: string | null;
  sessionId?: string | null;
  taskId?: string | null;
  selectedAssociatedOutputs?: Partial<
    Record<MatrixCalculationOperation, MatrixCalculationAssociatedOutputId[]>
  >;
  outputIdPrefix?: string;
  hypothesizedDifference?: number;
};

export type CalculationInputRole =
  | "subjectValue"
  | "targetMean"
  | "referenceMean"
  | "referenceStd"
  | "leftMean"
  | "rightMean"
  | "leftStd"
  | "rightStd";

export type ResolvedCalculationInputs = {
  matrices: Partial<Record<CalculationInputRole, MatrixRecord>>;
  warnings: string[];
  missingRoles: CalculationInputRole[];
};

export type MatrixCalculationSkipped = {
  operation: MatrixCalculationOperation;
  bandId: string;
  measureId: string;
  subjectId?: string;
  leftPopulationId?: string;
  rightPopulationId?: string;
  referencePopulationId?: string;
  reason: string;
  missingInputs?: string[];
};

export type MatrixCalculationPreviewRow = {
  operation: MatrixCalculationOperation;
  bandId: string;
  measureId: string;
  outputStatId: string;
  outputLabel: string;
  status: "ready" | "skipped";
  reason?: string;
  warnings: string[];
};

export type MatrixCalculationResult = {
  matrices: MatrixRecord[];
  warnings: string[];
  skipped: MatrixCalculationSkipped[];
  existing: MatrixRecord[];
};

export type MatrixCalculationState = ConnectivityDataState;
