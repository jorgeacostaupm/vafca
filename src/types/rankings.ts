import type { NetworkPanelLayoutItem } from "@/types/networkVisualization";

export type RankingTarget = "matrices" | "links" | "rois";
export type MatrixKindForRanking = "original" | "aggregated" | "comparison";
export type RankingMode =
  | "singleMatrix"
  | "matrixCollection";
export type RankingTopN = 10 | 25 | 50 | 100 | 250 | 500;
export type RankingScope =
  | "allLinks"
  | "activeRois"
  | "activeFilter"
  | "selectedLinks";
export type LinkCollectionRankingMode = "aggregated" | "expanded";

export type RankingHighlightItem =
  | { type: "matrix"; matrixId: string }
  | {
      type: "link";
      sourceId: string;
      targetId: string;
      endpointType: "roi" | "group";
      matrixIds?: string[];
    }
  | { type: "roi"; roiId: string };

export type RankingQuery = {
  target: RankingTarget;
  mode: RankingMode;
  linkCollectionMode?: LinkCollectionRankingMode;
  sourceType?: "population" | "subject" | "comparison";
  sourceId?: string;
  matrixKind?: MatrixKindForRanking;
  measureId?: string;
  statisticId?: string;
  bandIds?: string[];
  matrixId?: string;
  matrixIds?: string[];
  scope: RankingScope;
  metric: string;
  threshold?: number;
  topN: RankingTopN;
};

export type MatrixRankingRow = {
  type: "matrix";
  rank: number;
  matrixId: string;
  label: string;
  sourceType?: "population" | "subject" | "comparison";
  sourceId?: string;
  matrixKind?: MatrixKindForRanking;
  measureId?: string;
  statisticId?: string;
  bandId?: string;
  score: number;
  nLinksUsed: number;
};

export type LinkRankingRow = {
  type: "link";
  rank: number;
  sourceId: string;
  targetId: string;
  endpointType: "roi" | "group";
  sourceLabel: string;
  targetLabel: string;
  score: number;
  value?: number;
  valuesByMatrix?: Record<string, number>;
  valuesByBand?: Record<string, number>;
  bestMatrixId?: string;
  bestBandId?: string;
  nMatricesUsed?: number;
};

export type RoiRankingRow = {
  type: "roi";
  rank: number;
  roiId: string;
  label: string;
  group?: string;
  score: number;
  nIncidentLinks: number;
  meanValue?: number;
  maxValue?: number;
};

export type RankingRow = MatrixRankingRow | LinkRankingRow | RoiRankingRow;

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
  resultsOrder: string[];
  resultsById: Record<string, RankingResult>;
  layout: NetworkPanelLayoutItem[];
  hoveredItem?: RankingHighlightItem;
  selectedItem?: RankingHighlightItem;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  nextResultSeq: number;
};
