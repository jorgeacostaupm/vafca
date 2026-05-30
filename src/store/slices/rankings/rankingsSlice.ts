import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  RankingHighlightItem,
  RankingQuery,
} from "@/types/rankings";
import {
  DEFAULT_PANEL_GRID_CONFIG,
  DEFAULT_RANKING_PANEL_LAYOUT,
} from "@/config/ui";
import {
  createDefaultRankingQueryForTarget,
  initialRankingsState,
} from "@/store/slices/rankings/rankingsTypes";
import {
  recomputeRankingsForActiveFilters,
  runRankingQuery,
} from "@/store/slices/rankings/rankingsThunks";
import type { RankingTarget } from "@/types/rankings";

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
} = rankingsSlice.actions;

export default rankingsSlice.reducer;
