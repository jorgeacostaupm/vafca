import type { EntityState } from "@reduxjs/toolkit";

import type {
  Atlas,
  BundleMetadata,
  Catalogs,
  ConnectivityDataState,
  ConnectivityMatrix,
} from "@/types/connectivityBundle";

export type DatasetContent = ConnectivityDataState;

export type MatrixStats = {
  total: number;
  byStat: Record<string, number>;
  byMeasure: Record<string, number>;
  byMeasureStatPopulation: Record<string, Record<string, Record<string, number>>>;
  byMeasureStatPopulationSet: Record<string, Record<string, Record<string, number>>>;
};

export type DatasetMeta = {
  content: DatasetContent;
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

export type MatrixUploadRejected = {
  message: string;
  result?: MatrixUploadResult;
};

export type DatasetState = {
  schemaVersion: DatasetContent["schemaVersion"] | null;
  loadedBundle: BundleMetadata | null;
  atlas: Atlas | null;
  roiOrderHash: string | null;
  catalogs: Catalogs | null;
  matrices: EntityState<ConnectivityMatrix, string>;
};

export type DatasetOperationsState = {
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
  catalog: keyof Catalogs;
  id: string;
  changes: Record<string, unknown>;
};
