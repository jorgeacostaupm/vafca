import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { catalogItemUpdated } from '@/store/actions/catalogItemUpdated';
import type { CatalogNetworkPrunePayload } from "@/store/slices/dataset/utils/catalogNetworkPruning";
import {
  createDefaultRankingQueryForTarget,
  initialRankingsState,
} from "@/store/slices/rankings/rankingsTypes";
import {
  recomputeRankingsForActiveFilters,
  runRankingQuery,
} from "@/store/slices/rankings/thunks";
import type { RankingUiState } from '@/types/rankings';
import type {
  RankingHighlightItem,
  RankingQuery,
} from "@/types/rankings";
import type { RankingTarget } from "@/types/rankings";

const pruneAspectFilters = (
  filters: RankingQuery["aspectFilters"],
  disabledValueId: string,
) => {
  if (!filters) return filters;
  return Object.fromEntries(
    Object.entries(filters).map(([aspectId, values]) => [
      aspectId,
      values.filter((value) => value !== disabledValueId),
    ]),
  );
};

const pruneRankingQueryForCatalogItem = (
  query: RankingQuery,
  payload: CatalogNetworkPrunePayload,
): RankingQuery => {
  const invalidNetworkIds = new Set(payload.invalidNetworkIds);
  const next: RankingQuery = { ...query };

  if (payload.catalog === "sources") {
    next.sourceIds = next.sourceIds?.filter((sourceId) => sourceId !== payload.id);
    if (next.sourceIds?.length === 0) delete next.sourceIds;
    if (next.sourceId === payload.id) delete next.sourceId;
  }

  if (payload.catalog === "measures" && next.measureId === payload.id) {
    delete next.measureId;
    delete next.statisticId;
    delete next.aspectFilters;
  }

  if (payload.catalog === "statistics" && next.statisticId === payload.id) {
    delete next.statisticId;
    delete next.aspectFilters;
  }

  if (payload.catalog === "aspectCatalogs") {
    next.aspectFilters = pruneAspectFilters(next.aspectFilters, payload.id);
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

const pruneRankingQueries = (
  state: RankingUiState,
  action: PayloadAction<CatalogNetworkPrunePayload>,
) => {
  state.currentQuery = pruneRankingQueryForCatalogItem(state.currentQuery, action.payload);
  state.queriesByTarget[state.currentQuery.target] = state.currentQuery;
  Object.entries(state.queriesByTarget).forEach(([target, query]) => {
    if (!query) return;
    state.queriesByTarget[target as RankingTarget] = pruneRankingQueryForCatalogItem(query, action.payload);
  });
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
      action: PayloadAction<RankingHighlightItem | null>,
    ) {
      state.hoveredItem = action.payload;
    },
    setSelectedRankingItem(
      state,
      action: PayloadAction<RankingHighlightItem | null>,
    ) {
      state.selectedItem = action.payload;
    },
    removeRankingResult(state, action: PayloadAction<{ resultId: string }>) {
      delete state.resultsById[action.payload.resultId];
      state.resultsOrder = state.resultsOrder.filter(
        (id) => id !== action.payload.resultId,
      );
    },
    pruneRankingQueriesForDisabledCatalogItem: pruneRankingQueries,
  },
  extraReducers: (builder) => {
    builder
      .addCase(catalogItemUpdated, (state, { payload }) => {
        if (payload.prune) pruneRankingQueries(state, {
          type: catalogItemUpdated.type, payload: payload.prune,
        });
      })
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
      })
      .addCase(runRankingQuery.rejected, (state, action) => {
        state.status = "error";
        state.error =
          action.payload ?? action.error.message ?? "Failed to run ranking.";
      })
      .addCase(recomputeRankingsForActiveFilters.pending, (state, action) => {
        state.recomputeRequestId = action.meta.requestId;
      })
      .addCase(recomputeRankingsForActiveFilters.rejected, (state, action) => {
        if (state.recomputeRequestId === action.meta.requestId) state.recomputeRequestId = null;
      })
      .addCase(recomputeRankingsForActiveFilters.fulfilled, (state, action) => {
        if (state.recomputeRequestId !== action.meta.requestId) return;
        state.recomputeRequestId = null;
        action.payload.forEach((result) => {
          if (state.resultsById[result.id]) {
            state.resultsById[result.id] = result;
          }
        });
      });
  },
});

export const {
  setRankingActiveTab,
  patchRankingQuery,
  setRankingTarget,
  setHoveredRankingItem,
  setSelectedRankingItem,
  removeRankingResult,
  pruneRankingQueriesForDisabledCatalogItem,
} = rankingsSlice.actions;

export default rankingsSlice.reducer;
