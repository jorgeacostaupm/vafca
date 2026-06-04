export const CONNECTIVITY_SCHEMA_VERSION = "fc-connectivity-v1.0" as const;

export type MatrixKind = "subject" | "population" | "comparison" | "aggregated";
export type MatrixLayout = "full" | "upper_triangular" | "lower_triangular";
export type MatrixDtype = "float32" | "float64";
export type MatrixCellValue = number | null;
export type MatrixData = MatrixCellValue[][] | MatrixCellValue[];
export type ExpectedRange = [number, number] | null;
export type ScaleType = "sequential" | "diverging";
export type RangeMode =
  | "inherit_measure"
  | "non_negative_observed"
  | "observed"
  | "observed_symmetric"
  | "fixed";
export type UiRangeMode = "view_observed" | "catalog";

export type MatrixDataStatsBucket = {
  min: number | null;
  max: number | null;
  absMax: number | null;
  finiteCount: number;
  nullCount: number;
};

export type MatrixDataStats = {
  allValues: MatrixDataStatsBucket;
};

export type BundleMetadata = {
  id: string;
  label?: string;
  description?: string | null;
  createdAt?: string | null;
};

export type AtlasRoi = {
  index: number;
  id: string;
  atlasId: number | string;
  name: string;
  label: string;
  tags: Record<string, unknown>;
  coords?: unknown | null;
  metadata: Record<string, unknown>;
};

export type Atlas = {
  id: string;
  name: string;
  description?: string | null;
  version: string;
  space?: string | null;
  coordinateSystem?: string | null;
  rois: AtlasRoi[];
};

export type LayerCatalogEntry = {
  id: string;
  label: string;
  description?: string | null;
  enabled?: boolean;
};

export type MatrixValueDomain = {
  min: number | null;
  max: number | null;
  center: number | null;
  units?: string | null;
};

export type MeasureCatalogEntry = {
  id: string;
  label: string;
  description?: string | null;
  expectedRange: ExpectedRange;
  min?: number;
  max?: number;
  enabled?: boolean;
  valueDomain?: MatrixValueDomain;
  symmetric: boolean;
  directed: boolean;
};

export type StatCatalogEntry = {
  id: string;
  label: string;
  category: string;
  description?: string | null;
  scaleType: ScaleType;
  center: number | null;
  rangeMode: RangeMode;
  expectedRange?: ExpectedRange;
  min?: number;
  max?: number;
  enabled?: boolean;
  useDataRange?: boolean;
};

export type PopulationCatalogEntry = {
  id: string;
  label: string;
  description?: string | null;
  n?: number;
  enabled?: boolean;
  metadata: Record<string, unknown>;
};

export type SubjectCatalogEntry = {
  id: string;
  label: string;
  populationIds: string[];
  metadata: Record<string, unknown>;
};

export type Catalogs = {
  layers: Record<string, LayerCatalogEntry>;
  measures: Record<string, MeasureCatalogEntry>;
  stats: Record<string, StatCatalogEntry>;
  populations: Record<string, PopulationCatalogEntry>;
  subjects: Record<string, SubjectCatalogEntry>;
  roiGroupSchemes: Record<string, unknown>;
};

export type MatrixContext = {
  layerId: string | null;
  measureId: string;
  conditionId?: string | null;
  sessionId?: string | null;
  taskId?: string | null;
};

export type SubjectMatrixSource = {
  level: "subject";
  subjectId: string;
  populationIds: string[];
};

export type PopulationMatrixSource = {
  level: "population";
  populationIds: string[];
  n: number;
};

export type ComparisonSideSource = {
  level: "population" | "subject";
  populationIds?: string[];
  subjectId?: string;
  label?: string;
  n?: number;
};

export type ComparisonMatrixSource = {
  level: "comparison";
  left: ComparisonSideSource;
  right: ComparisonSideSource;
};

export type AggregationMatrixSource = {
  level: "aggregation";
  baseMatrixId: string;
  populationIds: string[];
};

export type MatrixSource =
  | SubjectMatrixSource
  | PopulationMatrixSource
  | ComparisonMatrixSource
  | AggregationMatrixSource;

export type MatrixStat = {
  id: string;
  method?: string | null;
  parameters: Record<string, unknown>;
};

export type MatrixComparison = {
  operator: string;
  comparisonType: string;
  formula: string;
  leftMatrixId?: string | null;
  rightMatrixId?: string | null;
  parameters: Record<string, unknown>;
};

export type MatrixGeometry = {
  atlasId: string;
  shape: [number, number];
  roiOrderRef: "atlas.rois" | null;
  roiOrder: string[] | null;
};

export type MatrixEncoding = {
  layout: MatrixLayout;
  dtype: MatrixDtype;
  symmetric: boolean;
  missingValue: MatrixCellValue;
};

export type MatrixProvenance = {
  generatedBy: string;
  createdAt?: string | null;
  software?: string | null;
  version?: string | null;
  dependencies: unknown[];
  parameters: Record<string, unknown>;
};

export type RoiGroup = {
  id: string;
  label: string;
  criteria: Record<string, string>;
  roiIds: string[];
};

export type AggregatedMatrixParameters = {
  baseMatrixId: string;
  fields: string[];
  aggregator: "mean";
  ignoreMissing: boolean;
  includeInactiveRois: boolean;
  missingTagPolicy: "unknown_group" | "exclude" | "error";
  groupOrderHash?: string;
  orderMode?: "matrix" | "circular";
  withinGroupMode: "upperTriangleNoDiagonal";
  betweenGroupMode: "allPairs";
  activeRoiSetHash: string;
};

export type MatrixAggregation = {
  baseMatrixId: string;
  source: "visualizationSettings" | "manual";
  fields: string[];
  aggregator: "mean";
  formula: string;
  parameters: AggregatedMatrixParameters;
  groups: RoiGroup[];
  cellCounts: number[][];
  excludedRoiIds: string[];
  activeRoiSetHash: string;
  stale?: boolean;
  staleReason?: string | null;
};

export type ConnectivityMatrix = {
  id: string;
  kind: MatrixKind;
  label?: string;
  context: MatrixContext;
  source: MatrixSource;
  stat: MatrixStat;
  geometry: MatrixGeometry;
  encoding: MatrixEncoding;
  valueDomain: MatrixValueDomain;
  dataStats?: MatrixDataStats;
  provenance: MatrixProvenance;
  comparison?: MatrixComparison;
  aggregation?: MatrixAggregation;
  data: MatrixData;
};

export type MatrixViewData = {
  id: string;
  layerId: string;
  measureId: string;
  statId: string;
  populationIds: string[];
  data: number[][];
  symmetric: boolean;
  dataStats?: MatrixDataStats;
};

export type ConnectivityBundle = {
  schemaVersion: typeof CONNECTIVITY_SCHEMA_VERSION;
  bundle: BundleMetadata;
  atlas: Atlas;
  catalogs: Catalogs;
  matrices: ConnectivityMatrix[];
};

export type ValidationIssue = {
  path: string;
  message: string;
  code?: string;
};

export type ValidationError = ValidationIssue;
export type ValidationWarning = ValidationIssue;

export type ValidationSummary = {
  matrixCount: number;
  populationCount: number;
  subjectCount: number;
  layerCount: number;
  measureCount: number;
};

export type ValidationResult = {
  valid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  summary: ValidationSummary;
};

export type ConnectivityValidationOptions = {
  strict?: boolean;
  strictValueRanges?: boolean;
  allowMissingComparisonDependencies?: boolean;
  allowTriangularLayout?: boolean;
};

export type ConnectivityDataState = {
  schemaVersion: typeof CONNECTIVITY_SCHEMA_VERSION;
  loadedBundle: BundleMetadata;
  atlas: Atlas;
  roiOrderHash: string;
  catalogs: Catalogs;
  matrices: ConnectivityMatrix[];
  matrixIndex: Record<string, ConnectivityMatrix>;
};

export type ConnectivityLoadResult = {
  state: ConnectivityDataState | null;
  status: "loaded" | "loaded_with_warnings" | "blocked";
  warnings: ValidationWarning[];
  errors: ValidationError[];
  summary: {
    bundleId?: string;
    matrices: number;
    layers: string[];
    measures: string[];
    populations: string[];
    subjects: string[];
  };
};
