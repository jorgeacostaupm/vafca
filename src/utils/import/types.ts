import type {
  AspectDefinition,
  CatalogItem,
  MatrixLayout,
  NodeCoordinates,
  RangeMode,
  ScaleType,
  Source,
  ValueRange,
} from "@/types/network";
import type { NetworkDataset } from "@/types/network";
import type { NodeOrderEntry } from "@/types/nodeOrder";

export const NORMALIZED_DATASET_SCHEMA_VERSION = "vafca-normalized-dataset-v1" as const;

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
  spatialFiles?: Record<string, Uint8Array>;
  fileName: string;
  files: string[];
  catalogs: unknown | null;
  catalogFiles: Record<string, unknown>;
  nodeMetadata: unknown | null;
  matrixFiles: RawMatrixFile[];
  errors: NetworkImportIssue[];
  warnings: NetworkImportIssue[];
};

export type SourceDraft = Source;

export type CatalogItemDraft = CatalogItem;

export type MeasureDraft = CatalogItem & {
  id: string;
  label: string;
  min?: number;
  max?: number;
  expectedRange?: ExpectedRange;
  description?: string | null;
  enabled?: boolean;
};

export type StatisticDraft = CatalogItem & {
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

export type CatalogsDraft = {
  core: {
    source: { id: "source"; label: string; description?: string | null };
    measure: { id: "measure"; label: string; description?: string | null };
    statistic: { id: "statistic"; label: string; description?: string | null };
  };
  aspects: AspectDefinition[];
  sources: Record<string, SourceDraft>;
  measures: Record<string, MeasureDraft>;
  statistics: Record<string, StatisticDraft>;
  aspectCatalogs: Record<string, Record<string, CatalogItemDraft>>;
};

export type NodeDraft = {
  index: number;
  id: string;
  label: string;
  name?: string;
  atlasId?: string | number;

  metadata: Record<string, unknown>;
  coords?: NodeCoordinates | null;
};

export type ImportedNetworkDraft = {
  id: string;
  label: string;
  layout: MatrixLayout;
  sourceId: string;
  measureId: string;
  statisticId: string;
  dimensions: Record<string, string>;
  data: (number | null)[][];
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
  };
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
