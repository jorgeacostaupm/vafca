import type { Network } from "./network";
import type { AggregatedNodeSet } from "./nodes";

export type NodeGroup = {
  id: string;
  label: string;
  criteria: Record<string, string>;
  nodeIds: string[];
};

export type NetworkComparisonDerivation = {
  type: "comparison";
  operator: string;
  comparisonType: string;
  formula: string;
  leftNetworkId?: string | null;
  rightNetworkId?: string | null;
  inputs?: [ComparisonNetworkInput, ComparisonNetworkInput];
  parameters: Record<string, unknown>;
};

export type ComparisonNetworkInput = Pick<Network, 'id' | 'sourceId' | 'measureId' | 'statisticId' | 'dimensions'>;

export type AggregationDerivation = {
  type: "aggregation";
  source: "visualizationSettings" | "manual";
  baseNetworkId: string;
  sourceNodeSetId: string;
  fields: string[];
  aggregator: "mean";
  formula: string;
  parameters: {
    baseNetworkId: string;
    fields: string[];
    aggregator: "mean";
    ignoreMissing: boolean;
    includeInactiveNodes: boolean;
    missingNodePolicy: "unknown_group" | "exclude" | "error";
    groupOrderHash?: string;
    orderMode?: "matrix" | "circular";
    withinGroupMode: "upperTriangleNoDiagonal";
    betweenGroupMode: "allPairs";
    activeNodeSetHash: string;
  };
  groups: NodeGroup[];
  cellCounts: number[][];
  missingNodePolicy: "unknown_group" | "exclude" | "error";
  excludedNodeIds: string[];
  activeNodeSetHash: string;
  groupOrderHash?: string;
  stale?: boolean;
  staleReason?: string | null;
};

export type NetworkDerivation =
  | NetworkComparisonDerivation
  | AggregationDerivation;

export type AggregatedNetworkView = {
  baseNetworkId: string;
  nodeSet: AggregatedNodeSet;
  network: Network;
  derivation: AggregationDerivation;
  createdAt: string;
};
