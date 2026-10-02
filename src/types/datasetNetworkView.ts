import type { ComparisonNetworkInput, NetworkDataStats } from "@/types/network";

export type MaterializedNetworkView = {
  id: string;
  compoundId: string;
  sourceId: string;
  measureId: string;
  statisticId: string;
  dimensions: Record<string, string>;
  nodeIds?: string[];
  data: number[][];
  symmetric: boolean;
  dataStats?: NetworkDataStats;
};

export type DatasetNetworkSummary = {
  comparisonInputs?: [ComparisonNetworkInput, ComparisonNetworkInput];
  compoundId: string;
  sourceId: string;
  measureId: string;
  statisticId: string;
  dimensions: Record<string, string>;
  size: number;
  symmetric: boolean;
};
