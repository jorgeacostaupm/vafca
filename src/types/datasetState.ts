import type { ConnectivityCatalogs } from "@/types/catalogs";
import type { ConnectivityDataState } from "@/types/connectivityBundle";
import type { ConnectivityDataset } from "@/types/datasets";

export type MatrixStats = {
  total: number;
  byStat: Record<string, number>;
  byMeasure: Record<string, number>;
  byMeasureStatPopulation: Record<string, Record<string, Record<string, number>>>;
  byMeasureStatPopulationSet: Record<string, Record<string, Record<string, number>>>;
};

export type DatasetMeta = {
  metadata: ConnectivityDataset["metadata"];
  catalogs: ConnectivityDataset["catalogs"];
  matrixStats: MatrixStats;
  connectivity?: ConnectivityDataState;
};

export type MatrixUploadError = {
  source: string;
  matrixId?: string;
  message: string;
};

export type MatrixUploadResult = {
  files: number;
  validMatrices: number;
  invalidMatrices: number;
  errors: MatrixUploadError[];
  warnings?: MatrixUploadError[];
};

export type DatasetState = {
  data: DatasetMeta | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  downloadStatus: "idle" | "loading" | "ready" | "error";
  downloadError: string | null;
  matrixUploadStatus: "idle" | "loading" | "ready" | "error";
  matrixUploadError: string | null;
  lastMatrixUpload: MatrixUploadResult | null;
  derivedCalculationStatus: "idle" | "loading" | "ready" | "error";
  derivedCalculationError: string | null;
};

export type UpdateCatalogPayload = {
  catalog: keyof ConnectivityCatalogs;
  id: string;
  changes: Partial<ConnectivityCatalogs[keyof ConnectivityCatalogs][string]>;
};

export type UpdateMetadataPayload = {
  changes: Partial<ConnectivityDataset["metadata"]>;
};
