import type { EntityState } from "@reduxjs/toolkit";

import type { Catalogs, Network, NetworkDataset, NodeSet } from "@/types/network";

export type DatasetContent = NetworkDataset;

export type NetworkStats = {
  total: number;
  byStat: Record<string, number>;
  byMeasure: Record<string, number>;
  byMeasureStatisticSource: Record<string, Record<string, Record<string, number>>>;
};

export type DatasetMeta = {
  content: DatasetContent;
};

export type NetworkImportError = {
  source: string;
  networkId?: string;
  message: string;
};

export type NetworkImportSummary = {
  files: number;
  validNetworks: number;
  invalidNetworks: number;
  errors: NetworkImportError[];
  warnings?: NetworkImportError[];
};

export type NetworkImportRejected = {
  message: string;
  result?: NetworkImportSummary;
};

export type DatasetState = {
  revision: number;
  id: string | null;
  label: string | null;
  description: string | null;
  createdAt: string | null;
  nodeSet: NodeSet | null;
  catalogs: Catalogs | null;
  networks: EntityState<Network, string>;
};

export type DatasetOperationsState = {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  downloadStatus: "idle" | "loading" | "ready" | "error";
  downloadError: string | null;
  networkImportStatus: "idle" | "loading" | "ready" | "error";
  networkImportError: string | null;
  lastNetworkImport: NetworkImportSummary | null;
  derivedCalculationStatus: "idle" | "loading" | "ready" | "error";
  derivedCalculationRequestIds: string[];
  derivedCalculationError: string | null;
};

export type UpdateCatalogPayload = {
  catalog: keyof Catalogs;
  aspectId?: string;
  id: string;
  changes: Record<string, unknown>;
};
