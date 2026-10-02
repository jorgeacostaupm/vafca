import type { SourceKind } from "@/types/network";

export type RankingTarget = "networks" | "links" | "nodes";
export type RankingNetworkKind = SourceKind | "aggregation";
export type RankingMode =
  | "singleNetwork"
  | "networkCollection";
export type RankingTopN = 10 | 25 | 50 | 100 | 250 | 500;
export type RankingScope =
  | "allLinks"
  | "activeNodes"
  | "activeFilter"
  | "selectedLinks";
export type LinkCollectionRankingMode = "aggregated" | "expanded";

export type RankingHighlightItem =
  | {
      type: "link";
      sourceId: string;
      targetId: string;
      endpointType: "node" | "group";
      networkIds?: string[];
    }
  | { type: "node"; nodeId: string };

export type RankingQuery = {
  target: RankingTarget;
  mode: RankingMode;
  linkCollectionMode?: LinkCollectionRankingMode;
  allowLinkRankingAutoconnections: boolean;
  allowNodeRankingAutoconnections: boolean;
  sourceIds?: string[];
  /** Legacy workspace field; new queries use sourceIds. */
  sourceId?: string;
  networkKind?: RankingNetworkKind;
  aggregationGroupingKey?: string;
  measureId?: string;
  statisticId?: string;
  aspectFilters?: Record<string, string[]>;
  networkId?: string;
  networkIds?: string[];
  scope: RankingScope;
  metric?: string;
  threshold?: number;
  topN: RankingTopN;
};

export type NetworkRankingRow = {
  type: "network";
  rank: number;
  networkId: string;
  label: string;
  sourceId?: string;
  networkKind?: RankingNetworkKind;
  aggregationGroupingKey?: string;
  measureId?: string;
  statisticId?: string;
  dimensions: Record<string, string>;
  score: number;
  nLinksUsed: number;
};

export type LinkRankingRow = {
  type: "link";
  rank: number;
  sourceId: string;
  targetId: string;
  endpointType: "node" | "group";
  sourceLabel: string;
  targetLabel: string;
  networkSourceId: string;
  score: number;
  valuesByNetwork?: Record<string, number>;
  valuesByAspectValue?: Record<string, number>;
  bestNetworkId?: string;
  bestAspectValue?: string;
  nNetworksUsed?: number;
};

export type NodeRankingRow = {
  type: "node";
  rank: number;
  nodeId: string;
  label: string;
  group?: string;
  networkSourceId: string;
  score: number;
  nIncidentLinks: number;
  meanValue?: number;
  maxValue?: number;
};

export type RankingRow = NetworkRankingRow | LinkRankingRow | NodeRankingRow;

export type EdgeRankingRow = LinkRankingRow;

export type RankingResult = {
  id: string;
  query: RankingQuery;
  rows: RankingRow[];
  totalEligibleItems: number;
  createdAt: string;
  warnings?: string[];
};

export type RankingUiState = {
  recomputeRequestId: string | null;
  activeTab: "views" | "rankings";
  currentQuery: RankingQuery;
  queriesByTarget: Partial<Record<RankingTarget, RankingQuery>>;
  resultsOrder: string[];
  resultsById: Record<string, RankingResult>;
  hoveredItem: RankingHighlightItem | null;
  selectedItem: RankingHighlightItem | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  nextResultSeq: number;
};
