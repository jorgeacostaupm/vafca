import type { NetworkLayoutItem } from "@/types/networkVisualization";

export type RankingTarget = "networks" | "links" | "nodes";
export type RankingNetworkKind = "population" | "subject" | "comparison" | "aggregation";
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
  sourceType?: "population" | "subject" | "comparison";
  sourceId?: string;
  networkKind?: RankingNetworkKind;
  aggregationGroupingKey?: string;
  measureId?: string;
  statisticId?: string;
  layerIds?: string[];
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
  sourceType?: "population" | "subject" | "comparison";
  sourceId?: string;
  networkKind?: RankingNetworkKind;
  aggregationGroupingKey?: string;
  measureId?: string;
  statisticId?: string;
  layerId?: string;
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
  score: number;
  valuesByNetwork?: Record<string, number>;
  valuesByLayer?: Record<string, number>;
  bestNetworkId?: string;
  bestLayerId?: string;
  nNetworksUsed?: number;
};

export type NodeRankingRow = {
  type: "node";
  rank: number;
  nodeId: string;
  label: string;
  group?: string;
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
  activeTab: "views" | "rankings";
  currentQuery: RankingQuery;
  queriesByTarget: Partial<Record<RankingTarget, RankingQuery>>;
  resultsOrder: string[];
  resultsById: Record<string, RankingResult>;
  layout: NetworkLayoutItem[];
  hoveredItem?: RankingHighlightItem;
  selectedItem?: RankingHighlightItem;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  nextResultSeq: number;
};
