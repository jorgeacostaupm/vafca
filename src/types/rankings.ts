import type { MatrixKind } from "@/types/connectivityBundle";
import type { NetworkLayoutItem } from "@/types/networkVisualization";

export type RankingTarget = "matrices" | "links" | "rois";
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
  allowLinkRankingAutoconnections: boolean;
  allowRoiRankingAutoconnections: boolean;
  sourceType?: "population" | "subject" | "comparison";
  sourceId?: string;
  matrixKind?: MatrixKind;
  aggregationGroupingKey?: string;
  measureId?: string;
  statisticId?: string;
  layerIds?: string[];
  matrixId?: string;
  matrixIds?: string[];
  scope: RankingScope;
  metric?: string;
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
  matrixKind?: MatrixKind;
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
  endpointType: "roi" | "group";
  sourceLabel: string;
  targetLabel: string;
  score: number;
  valuesByMatrix?: Record<string, number>;
  valuesByLayer?: Record<string, number>;
  bestMatrixId?: string;
  bestLayerId?: string;
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
