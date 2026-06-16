import type {
  Network,
  NetworkDataset,
  NetworkSource,
  RangeMode,
  ScaleType,
  ValueRange,
} from "@/types/network";

export const EPSILON = 1e-12;

export type NetworkCalculationOperation =
  | "subject_zscore_vs_population"
  | "subject_difference"
  | "population_reference_zscore"
  | "population_difference"
  | "population_cohens_d"
  | "population_two_sample_z_test"
  | "population_welch_t";

export type NetworkCalculationAssociatedOutputId =
  | "student_t_from_cohens_d"
  | "student_p_value_from_cohens_d"
  | "two_sample_z_p_value"
  | "welch_p_value";

export type NetworkCalculationScope =
  | "subject_vs_population"
  | "subject_vs_subject"
  | "population_vs_population";

export type NetworkCalculationCategory =
  | "descriptive_standardization"
  | "group_comparison"
  | "effect_size"
  | "parametric_test";

export type NetworkCalculationInputKind = NetworkSource["type"];

export type NetworkCalculationInputSpec = {
  role: string;
  label: string;
  kind?: NetworkCalculationInputKind;
  statId?: string;
  sourceLevel?: "subject" | "population" | "comparison";
  required: boolean;
};

export type NetworkCalculationOutputSpec = {
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
  expectedRange?: ValueRange | null;
  useDataRange?: boolean;
  description?: string | null;
};

export type NetworkCalculationAssociatedOutputSpec = {
  id: NetworkCalculationAssociatedOutputId;
  label: string;
  description: string;
  defaultEnabled: boolean;
  outputs: NetworkCalculationOutputSpec[];
};

export type NetworkCalculationMethodDefinition = {
  id: NetworkCalculationOperation;
  label: string;
  shortLabel: string;
  scope: NetworkCalculationScope;
  category: NetworkCalculationCategory;
  description: string;
  formulaText: string;
  formulaLatex?: string;
  interpretation: string;
  requirements: string[];
  requiredInputs: NetworkCalculationInputSpec[];
  outputs: NetworkCalculationOutputSpec[];
  associatedOutputs?: NetworkCalculationAssociatedOutputSpec[];
  requiresControlOrReference: boolean;
  recommendedUse?: string;
  warnings?: string[];
  assumptions?: string[];
};

export type NetworkCalculationMethodContext = {
  request: NetworkCalculationBatchRequest;
  state: NetworkCalculationState;
  result: NetworkCalculationResult;
  existingIds: Set<string>;
};

export type NetworkCalculationMethod = {
  definition: NetworkCalculationMethodDefinition;
  calculate: (context: NetworkCalculationMethodContext) => void;
};

export type NetworkCalculationBatchRequest = {
  operations: NetworkCalculationOperation[];
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
    Record<NetworkCalculationOperation, NetworkCalculationAssociatedOutputId[]>
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
  networks: Partial<Record<CalculationInputRole, Network>>;
  warnings: string[];
  missingRoles: CalculationInputRole[];
};

export type NetworkCalculationSkipped = {
  operation: NetworkCalculationOperation;
  layerId: string;
  measureId: string;
  subjectId?: string;
  leftPopulationId?: string;
  rightPopulationId?: string;
  referencePopulationId?: string;
  reason: string;
  missingInputs?: string[];
};

export type NetworkCalculationPreviewRow = {
  operation: NetworkCalculationOperation;
  layerId: string;
  measureId: string;
  outputStatId: string;
  outputLabel: string;
  status: "ready" | "skipped";
  reason?: string;
  warnings: string[];
};

export type NetworkCalculationResult = {
  networks: Network[];
  warnings: string[];
  skipped: NetworkCalculationSkipped[];
  existing: Network[];
};

export type NetworkCalculationState = NetworkDataset;
