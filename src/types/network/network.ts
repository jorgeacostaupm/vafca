import type { NetworkDerivation } from "./aggregation";
import type { Catalogs } from "./catalogs";
import type { NetworkData, NetworkDataStats, NetworkValueDomain } from "./networkData";
import type { NodeSet } from "./nodes";

export type NetworkProvenance = {
  generatedBy: string;
  createdAt?: string | null;
  software?: string | null;
  version?: string | null;
  dependencies: string[];
  parameters: Record<string, unknown>;
};

export type Network = {
  id: string;
  label?: string;
  sourceId: string;
  measureId: string;
  statisticId: string;
  dimensions: Record<string, string>;
  nodeSetId: string;
  nodeIds: string[];
  data: NetworkData;
  valueDomain?: NetworkValueDomain;
  dataStats?: NetworkDataStats;
  provenance: NetworkProvenance;
  derivation?: NetworkDerivation;
};

export type NetworkDataset = {
  id: string;
  label: string;
  description?: string | null;
  createdAt?: string | null;
  nodeSet: NodeSet;
  catalogs: Catalogs;
  networks: Network[];
  networkIndex: Record<string, Network>;
};
