import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  DEFAULT_PANEL_GRID_CONFIG,
  DEFAULT_RANKING_PANEL_LAYOUT,
} from "@/config/ui";
import type { CatalogMatrixPrunePayload } from "@/store/slices/dataset/utils/catalogMatrixPruning";
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
  payload: CatalogMatrixPrunePayload,
): RankingQuery => {
  const invalidMatrixIds = new Set(payload.invalidMatrixIds);
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

  if (payload.catalog === "stats" && next.statisticId === payload.id) {
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

  if (next.matrixId && invalidMatrixIds.has(next.matrixId)) {
    delete next.matrixId;
  }

  if (next.matrixIds) {
    const matrixIds = next.matrixIds.filter(
      (matrixId) => !invalidMatrixIds.has(matrixId),
    );
    if (matrixIds.length > 0) {
      next.matrixIds = matrixIds;
    } else {
      delete next.matrixIds;
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
      action: PayloadAction<CatalogMatrixPrunePayload>,
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
        const panelsPerRow = Math.max(
          1,
          Math.floor(
            DEFAULT_PANEL_GRID_CONFIG.columns / DEFAULT_RANKING_PANEL_LAYOUT.width,
          ),
        );
        const x =
          DEFAULT_RANKING_PANEL_LAYOUT.initialX +
          (state.layout.length % panelsPerRow) * DEFAULT_RANKING_PANEL_LAYOUT.width;
        const y =
          DEFAULT_RANKING_PANEL_LAYOUT.initialY +
          Math.floor(state.layout.length / panelsPerRow) *
            DEFAULT_RANKING_PANEL_LAYOUT.height;
        state.layout = [
          {
            i: action.payload.id,
            x,
            y,
            w: DEFAULT_RANKING_PANEL_LAYOUT.width,
            h: DEFAULT_RANKING_PANEL_LAYOUT.height,
          },
          ...state.layout,
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
