import type {
  ConnectivityDataState,
  ConnectivityMatrix,
  ExpectedRange,
  MatrixKind,
  RangeMode,
  ScaleType,
} from "@/types/connectivityBundle";

export const EPSILON = 1e-12;

export type MatrixCalculationOperation =
  | "subject_zscore_vs_population"
  | "subject_difference"
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
  | "subject_vs_subject"
  | "population_vs_population";

export type MatrixCalculationCategory =
  | "descriptive_standardization"
  | "group_comparison"
  | "effect_size"
  | "parametric_test";

export type MatrixCalculationInputKind = Exclude<MatrixKind, "aggregated">;

export type MatrixCalculationInputSpec = {
  role: string;
  label: string;
  kind?: MatrixCalculationInputKind;
  statId?: string;
  sourceLevel?: "subject" | "population" | "comparison";
  required: boolean;
};

export type MatrixCalculationOutputSpec = {
  statId: string;
  statLabel: string;
  statCategory: "comparison" | "derived" | "aggregation";
  operator: string;
  comparisonType: string;
  labelSuffix: string;
  units: string | null;
  scaleType: ScaleType;
  center: number | null;
  rangeMode: RangeMode;
  expectedRange?: ExpectedRange;
  useDataRange?: boolean;
  description?: string | null;
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

export type MatrixCalculationMethodContext = {
  request: MatrixCalculationBatchRequest;
  state: MatrixCalculationState;
  result: MatrixCalculationResult;
  existingIds: Set<string>;
};

export type MatrixCalculationMethod = {
  definition: MatrixCalculationMethodDefinition;
  calculate: (context: MatrixCalculationMethodContext) => void;
};

export type MatrixCalculationBatchRequest = {
  operations: MatrixCalculationOperation[];
  leftPopulationId?: string;
  rightPopulationId?: string;
  referencePopulationId?: string;
  rightSubjectId?: string;
  subjectIds?: string[];
  layerIds: string[];
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
  | "leftSubjectValue"
  | "rightSubjectValue"
  | "targetMean"
  | "referenceMean"
  | "referenceStd"
  | "leftMean"
  | "rightMean"
  | "leftStd"
  | "rightStd";

export type ResolvedCalculationInputs = {
  matrices: Partial<Record<CalculationInputRole, ConnectivityMatrix>>;
  warnings: string[];
  missingRoles: CalculationInputRole[];
};

export type MatrixCalculationSkipped = {
  operation: MatrixCalculationOperation;
  layerId: string;
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
  layerId: string;
  measureId: string;
  outputStatId: string;
  outputLabel: string;
  status: "ready" | "skipped";
  reason?: string;
  warnings: string[];
};

export type MatrixCalculationResult = {
  matrices: ConnectivityMatrix[];
  warnings: string[];
  skipped: MatrixCalculationSkipped[];
  existing: ConnectivityMatrix[];
};

export type MatrixCalculationState = ConnectivityDataState;
