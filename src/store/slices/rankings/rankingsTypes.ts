import {
  DEFAULT_LINK_COLLECTION_RANKING_MODE,
  DEFAULT_LINK_RANKING_ALLOW_AUTOCONNECTIONS,
  DEFAULT_NETWORK_VISUALIZATION_TAB,
  DEFAULT_NODE_RANKING_ALLOW_AUTOCONNECTIONS,
  DEFAULT_RANKING_TARGET,
  DEFAULT_RANKING_TOP_N,
} from "@/config/ui";
import type { RankingQuery, RankingTarget, RankingUiState } from "@/types/rankings";

export const createDefaultRankingQueryForTarget = (
  target: RankingTarget,
): RankingQuery => ({
  target,
  mode: "networkCollection",
  linkCollectionMode: DEFAULT_LINK_COLLECTION_RANKING_MODE,
  allowLinkRankingAutoconnections: DEFAULT_LINK_RANKING_ALLOW_AUTOCONNECTIONS,
  allowNodeRankingAutoconnections: DEFAULT_NODE_RANKING_ALLOW_AUTOCONNECTIONS,
  aspectFilters: {},
  scope: "allLinks",
  topN: DEFAULT_RANKING_TOP_N,
  threshold: 0,
});

export const defaultRankingQuery: RankingQuery =
  createDefaultRankingQueryForTarget(DEFAULT_RANKING_TARGET);

export const initialRankingsState: RankingUiState = {
  activeTab: DEFAULT_NETWORK_VISUALIZATION_TAB,
  currentQuery: defaultRankingQuery,
  queriesByTarget: {
    [DEFAULT_RANKING_TARGET]: defaultRankingQuery,
  },
  resultsOrder: [],
  resultsById: {},
  hoveredItem: null,
  selectedItem: null,
  status: "idle",
  error: null,
  nextResultSeq: 1,
};
