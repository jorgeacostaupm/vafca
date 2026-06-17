import type { NetworkDataStats } from "@/types/network";

export type MaterializedNetworkView = {
  id: string;
  compoundId: string;
  layerId: string;
  measureId: string;
  statId: string;
  populationIds: string[];
  data: number[][];
  symmetric: boolean;
  dataStats?: NetworkDataStats;
};

export type DatasetNetworkSummary = {
  compoundId: string;
  layerId: string;
  measureId: string;
  statId: string;
  populationIds: string[];
  size: number;
  symmetric: boolean;
};
