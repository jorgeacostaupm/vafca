import type {
  MatrixLayout,
  RangeMode,
  ScaleType,
  ValueRange,
} from "@/types/network";
import type { NetworkDataset } from "@/types/network";
import type { NodeOrderEntry } from "@/types/nodeOrder";

export const NORMALIZED_DATASET_SCHEMA_VERSION = "vafca-normalized-dataset-v1" as const;

export type NetworkImportMode = "lenient" | "strict";

export type NetworkImportIssue = {
  source: string;
  path: string;
  message: string;
};

export type ExpectedRange = ValueRange | null;

export type RawMatrixFile = {
  source: string;
  payload: unknown;
};

export type RawNetworkPackage = {
  fileName: string;
  files: string[];
  manifest: unknown | null;
  catalogs: unknown | null;
  catalogFiles: Record<string, unknown>;
  nodeMetadata: unknown | null;
  matrixFiles: RawMatrixFile[];
  errors: NetworkImportIssue[];
  warnings: NetworkImportIssue[];
};

export type LayerDraft = {
  id: string;
  label?: string;
  description?: string | null;
  enabled?: boolean;
};

export type MeasureDraft = {
  id: string;
  label: string;
  min?: number;
  max?: number;
  expectedRange?: ExpectedRange;
  description?: string | null;
  enabled?: boolean;
};

export type StatisticDraft = {
  id: string;
  label: string;
  category?: string;
  min?: number;
  max?: number;
  scaleType?: ScaleType;
  center?: number | null;
  rangeMode?: RangeMode;
  expectedRange?: ExpectedRange;
  description?: string | null;
  enabled?: boolean;
  useDataRange?: boolean;
};

export type PopulationDraft = {
  id: string;
  label: string;
  description?: string | null;
  enabled?: boolean;
};

export type CatalogsDraft = {
  layers: Record<string, LayerDraft>;
  measures: Record<string, MeasureDraft>;
  statistics: Record<string, StatisticDraft>;
  populations: Record<string, PopulationDraft>;
};

export type NodeDraft = {
  index: number;
  id: string;
  label: string;
  name?: string;
  tags: Record<string, string | number | boolean | null>;
  metadata: Record<string, unknown>;
};

export type ImportedNetworkDraft = {
  id: string;
  label: string;
  kind: "population" | "subject" | "comparison";
  layout: MatrixLayout;
  layerId: string;
  measureId: string;
  statisticId: string;
  populationIds: string[];
  subjectId?: string;
  comparison?: {
    left: string;
    right: string;
    comparisonType: string;
  };
  n?: number;
  data: (number | null)[][];
  symmetric: boolean;
  valueDomain: {
    min: number | null;
    max: number | null;
    center: number | null;
  };
  source: string;
};

export type NetworkImportInference = {
  generatedNodes: boolean;
  generatedNodeIds: string[];
  generatedNetworkIds: string[];
  inferredFields: Array<{
    source: string;
    field: string;
    value: string;
  }>;
};

export type NetworkDatasetDraft = {
  schemaVersion: typeof NORMALIZED_DATASET_SCHEMA_VERSION;
  source: {
    format: "zip";
    fileName: string;
    importedAt: string;
    importMode: NetworkImportMode;
  };
  manifest: Record<string, unknown>;
  atlas: {
    id: string;
    name: string;
    nodes: NodeDraft[];
  };
  catalogs: CatalogsDraft;
  networks: ImportedNetworkDraft[];
  inference: NetworkImportInference;
  issues: {
    errors: NetworkImportIssue[];
    warnings: NetworkImportIssue[];
  };
};

export type NetworkImportResult = {
  normalized: NetworkDatasetDraft;
  dataset: NetworkDataset;
  nodeOrder: NodeOrderEntry[];
};
