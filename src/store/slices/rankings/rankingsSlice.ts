import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  DEFAULT_NETWORK_PANEL_LAYOUT,
  DEFAULT_RANKING_PANEL_LAYOUT,
} from "@/config/ui";
import type { CatalogNetworkPrunePayload } from "@/store/slices/dataset/utils/catalogNetworkPruning";
import { addNetworkLayoutItem } from "@/store/slices/networkLayout";
import {
  createDefaultRankingQueryForTarget,
  initialRankingsState,
} from "@/store/slices/rankings/rankingsTypes";
import {
  recomputeRankingsForActiveFilters,
  runRankingQuery,
} from "@/store/slices/rankings/thunks";
import type {
  RankingHighlightItem,
  RankingQuery,
} from "@/types/rankings";
import type { RankingTarget } from "@/types/rankings";

const pruneRankingQueryForCatalogItem = (
  query: RankingQuery,
  payload: CatalogNetworkPrunePayload,
): RankingQuery => {
  const invalidNetworkIds = new Set(payload.invalidNetworkIds);
  const next: RankingQuery = { ...query };

  if (
    payload.catalog === "populations" &&
    next.sourceType === "population" &&
    next.sourceId === payload.id
  ) {
    delete next.sourceId;
  }

  if (payload.catalog === "measures" && next.measureId === payload.id) {
    delete next.measureId;
    delete next.statisticId;
    delete next.layerIds;
  }

  if (payload.catalog === "statistics" && next.statisticId === payload.id) {
    delete next.statisticId;
    delete next.layerIds;
  }

  if (payload.catalog === "layers" && next.layerIds?.includes(payload.id)) {
    const layerIds = next.layerIds.filter((layerId) => layerId !== payload.id);
    if (layerIds.length > 0) {
      next.layerIds = layerIds;
    } else {
      delete next.layerIds;
    }
  }

  if (next.networkId && invalidNetworkIds.has(next.networkId)) {
    delete next.networkId;
  }

  if (next.networkIds) {
    const networkIds = next.networkIds.filter(
      (networkId) => !invalidNetworkIds.has(networkId),
    );
    if (networkIds.length > 0) {
      next.networkIds = networkIds;
    } else {
      delete next.networkIds;
    }
  }

  return next;
};

const rankingsSlice = createSlice({
  name: "rankings",
  initialState: initialRankingsState,
  reducers: {
    setRankingActiveTab(
      state,
      action: PayloadAction<"views" | "rankings">,
    ) {
      state.activeTab = action.payload;
    },
    patchRankingQuery(state, action: PayloadAction<Partial<RankingQuery>>) {
      const nextQuery = {
        ...state.currentQuery,
        ...action.payload,
      };
      state.currentQuery = nextQuery;
      state.queriesByTarget[nextQuery.target] = nextQuery;
    },
    setRankingTarget(state, action: PayloadAction<RankingTarget>) {
      const target = action.payload;
      state.queriesByTarget[state.currentQuery.target] = state.currentQuery;
      state.currentQuery =
        state.queriesByTarget[target] ??
        createDefaultRankingQueryForTarget(target);
      state.queriesByTarget[target] = state.currentQuery;
    },
    setHoveredRankingItem(
      state,
      action: PayloadAction<RankingHighlightItem | undefined>,
    ) {
      state.hoveredItem = action.payload;
    },
    setSelectedRankingItem(
      state,
      action: PayloadAction<RankingHighlightItem | undefined>,
    ) {
      state.selectedItem = action.payload;
    },
    setRankingLayout(
      state,
      action: PayloadAction<Array<{ i: string; x: number; y: number; w: number; h: number }>>,
    ) {
      state.layout = action.payload.map((entry) => ({ ...entry }));
    },
    removeRankingResult(state, action: PayloadAction<{ resultId: string }>) {
      delete state.resultsById[action.payload.resultId];
      state.resultsOrder = state.resultsOrder.filter(
        (id) => id !== action.payload.resultId,
      );
      state.layout = state.layout.filter((item) => item.i !== action.payload.resultId);
    },
    pruneRankingQueriesForDisabledCatalogItem(
      state,
      action: PayloadAction<CatalogNetworkPrunePayload>,
    ) {
      state.currentQuery = pruneRankingQueryForCatalogItem(
        state.currentQuery,
        action.payload,
      );
      state.queriesByTarget[state.currentQuery.target] = state.currentQuery;
      Object.entries(state.queriesByTarget).forEach(([target, query]) => {
        if (!query) return;
        state.queriesByTarget[target as RankingTarget] =
          pruneRankingQueryForCatalogItem(query, action.payload);
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runRankingQuery.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(runRankingQuery.fulfilled, (state, action) => {
        state.status = "ready";
        state.error = null;
        state.nextResultSeq += 1;
        state.resultsOrder.unshift(action.payload.id);
        state.resultsById[action.payload.id] = action.payload;
        state.layout = [
          {
            i: action.payload.id,
            x: DEFAULT_RANKING_PANEL_LAYOUT.initialX,
            y: DEFAULT_RANKING_PANEL_LAYOUT.initialY,
            w: DEFAULT_RANKING_PANEL_LAYOUT.width,
            h: DEFAULT_RANKING_PANEL_LAYOUT.height,
          },
          ...state.layout.map((entry) => ({
            ...entry,
            y: entry.y + DEFAULT_RANKING_PANEL_LAYOUT.height,
          })),
        ];
      })
      .addCase(runRankingQuery.rejected, (state, action) => {
        state.status = "error";
        state.error =
          action.payload ?? action.error.message ?? "Failed to run ranking.";
      })
      .addCase(recomputeRankingsForActiveFilters.fulfilled, (state, action) => {
        action.payload.forEach((result) => {
          if (state.resultsById[result.id]) {
            state.resultsById[result.id] = result;
          }
        });
      })
      .addCase(addNetworkLayoutItem, (state, action) => {
        const yOffset =
          action.payload.yOffset ??
          action.payload.defaultH ??
          DEFAULT_NETWORK_PANEL_LAYOUT.height;
        state.layout = state.layout.map((entry) => ({
          ...entry,
          y: entry.y + yOffset,
        }));
      });
  },
});

export const {
  setRankingActiveTab,
  patchRankingQuery,
  setRankingTarget,
  setHoveredRankingItem,
  setSelectedRankingItem,
  setRankingLayout,
  removeRankingResult,
  pruneRankingQueriesForDisabledCatalogItem,
} = rankingsSlice.actions;

export default rankingsSlice.reducer;
