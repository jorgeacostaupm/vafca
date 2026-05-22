import { createAsyncThunk } from "@reduxjs/toolkit";
import { computeRanking } from "@/utils/rankings/rankingCalculations";
import { getRankingQueryMissingFields } from "@/components/rankings/rankingOptions";
import type { AppDispatch, RootState } from "@/types/store";
import type { RankingResult } from "@/types/rankings";

export const runRankingQuery = createAsyncThunk<
  RankingResult,
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>("rankings/runRankingQuery", async (_, { getState, rejectWithValue }) => {
  const state = getState();
  const connectivity = state.dataset.data?.connectivity;
  if (!connectivity) {
    return rejectWithValue("No connectivity dataset is loaded.");
  }

  const activeRois = new Set(
    state.atlas.order.filter((id) => state.atlas.labelsById[id]?.enabled),
  );
  const query = state.rankings.currentQuery;
  const missingFields = getRankingQueryMissingFields(query, connectivity);
  if (missingFields.length > 0) {
    return rejectWithValue(
      `Complete ranking fields before adding: ${missingFields.join(", ")}.`,
    );
  }
  const activeFilterMask = state.networkVisualization.activeEdgeMask?.values ?? null;

  const result = computeRanking({
    connectivity,
    query,
    activeRois,
    activeFilterMask,
  });
  const seq = state.rankings.nextResultSeq;
  return {
    ...result,
    id: `ranking-${seq}`,
    createdAt: new Date().toISOString(),
  };
});

export const recomputeRankingsForActiveFilters = createAsyncThunk<
  RankingResult[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>("rankings/recomputeRankingsForActiveFilters", async (_, { getState, rejectWithValue }) => {
  const state = getState();
  const connectivity = state.dataset.data?.connectivity;
  if (!connectivity) {
    return rejectWithValue("No connectivity dataset is loaded.");
  }

  const existingResults = state.rankings.resultsOrder
    .map((id) => state.rankings.resultsById[id])
    .filter((result): result is RankingResult => Boolean(result));

  if (existingResults.length === 0) return [];

  const activeRois = new Set(
    state.atlas.order.filter((id) => state.atlas.labelsById[id]?.enabled),
  );
  const activeFilterMask = state.networkVisualization.activeEdgeMask?.values ?? null;

  return existingResults.map((existing) => {
    const result = computeRanking({
      connectivity,
      query: existing.query,
      activeRois,
      activeFilterMask,
    });
    return {
      ...result,
      id: existing.id,
      createdAt: existing.createdAt,
    };
  });
});
