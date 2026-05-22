import type { RankingQuery, RankingUiState } from "@/types/rankings";

export const defaultRankingQuery: RankingQuery = {
  target: "matrices",
  mode: "matrixCollection",
  linkCollectionMode: "aggregated",
  scope: "allLinks",
  metric: "meanAbsValue",
  topN: 25,
  threshold: 0,
};

export const initialRankingsState: RankingUiState = {
  activeTab: "views",
  currentQuery: defaultRankingQuery,
  resultsOrder: [],
  resultsById: {},
  layout: [],
  status: "idle",
  error: null,
  nextResultSeq: 1,
};
