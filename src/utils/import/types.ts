import type {
  ConnectivityDataState,
  ExpectedRange,
  MatrixLayout,
  RangeMode,
  ScaleType,
} from "@/types/connectivityBundle";
import type { MatrixOrderEntry } from "@/types/matrixOrder";

export const NORMALIZED_DATASET_SCHEMA_VERSION = "vafca-normalized-dataset-v1" as const;

export type ConnectivityImportMode = "lenient" | "strict";

export type ConnectivityImportIssue = {
  source: string;
  path: string;
  message: string;
};

export type RawZipMatrixFile = {
  source: string;
  payload: unknown;
};

export type RawConnectivityZipPackage = {
  fileName: string;
  files: string[];
  manifest: unknown | null;
  catalogs: unknown | null;
  catalogFiles: Record<string, unknown>;
  rois: unknown | null;
  matrixFiles: RawZipMatrixFile[];
  errors: ConnectivityImportIssue[];
  warnings: ConnectivityImportIssue[];
};

export type ImportLayerCatalogItem = {
  id: string;
  label?: string;
  description?: string | null;
  enabled?: boolean;
};

export type ImportMeasureCatalogItem = {
  id: string;
  label: string;
  min?: number;
  max?: number;
  expectedRange?: ExpectedRange;
  description?: string | null;
  enabled?: boolean;
};

export type ImportStatCatalogItem = {
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

export type ImportPopulationCatalogItem = {
  id: string;
  label: string;
  description?: string | null;
  enabled?: boolean;
};

export type ImportCatalogs = {
  layers: Record<string, ImportLayerCatalogItem>;
  measures: Record<string, ImportMeasureCatalogItem>;
  stats: Record<string, ImportStatCatalogItem>;
  populations: Record<string, ImportPopulationCatalogItem>;
};

export type NormalizedRoi = {
  index: number;
  id: string;
  label: string;
  name?: string;
  tags: Record<string, string | number | boolean | null>;
  metadata: Record<string, unknown>;
};

export type NormalizedMatrix = {
  id: string;
  label: string;
  kind: "population" | "subject" | "comparison";
  layout: MatrixLayout;
  layerId: string;
  measureId: string;
  statId: string;
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

export type NormalizedImportInference = {
  generatedRois: boolean;
  generatedRoiIds: string[];
  generatedMatrixIds: string[];
  inferredFields: Array<{
    source: string;
    field: string;
    value: string;
  }>;
};

export type NormalizedConnectivityDataset = {
  schemaVersion: typeof NORMALIZED_DATASET_SCHEMA_VERSION;
  source: {
    format: "zip";
    fileName: string;
    importedAt: string;
    importMode: ConnectivityImportMode;
  };
  manifest: Record<string, unknown>;
  atlas: {
    id: string;
    name: string;
    rois: NormalizedRoi[];
  };
  catalogs: ImportCatalogs;
  matrices: NormalizedMatrix[];
  inference: NormalizedImportInference;
  issues: {
    errors: ConnectivityImportIssue[];
    warnings: ConnectivityImportIssue[];
  };
};

export type ConnectivityImportResult = {
  normalized: NormalizedConnectivityDataset;
  connectivity: ConnectivityDataState;
  matrixOrder: MatrixOrderEntry[];
};
