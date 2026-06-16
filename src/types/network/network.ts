import type { NetworkDerivation } from "./aggregation";
import type { Catalogs } from "./catalogs";
import type { NetworkData, NetworkDataStats, NetworkValueDomain } from "./networkData";
import type { NodeSet } from "./nodes";

export type PopulationNetworkSource = {
  type: "population";
  populationId: string;
  n?: number;
};

export type SubjectNetworkSource = {
  type: "subject";
  subjectId: string;
};

export type ComparisonSide =
  | {
      type: "population";
      populationId: string;
      n?: number;
      label?: string;
    }
  | {
      type: "subject";
      subjectId: string;
      label?: string;
    };

export type ComparisonNetworkSource = {
  type: "comparison";
  left: ComparisonSide;
  right: ComparisonSide;
};

export type NetworkSource =
  | PopulationNetworkSource
  | SubjectNetworkSource
  | ComparisonNetworkSource;

export type NetworkContext = {
  layerId: string | null;
  conditionId?: string | null;
  sessionId?: string | null;
  taskId?: string | null;
  metadata?: Record<string, unknown>;
};

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
  source: NetworkSource;
  context: NetworkContext;
  measureId: string;
  statisticId: string;
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
