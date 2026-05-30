import { createAsyncThunk } from "@reduxjs/toolkit";
import { computeRanking } from "@/utils/rankings/rankingCalculations";
import { getRankingQueryMissingFields } from "@/components/rankings/rankingOptions";
import type { AppDispatch, RootState } from "@/types/store";
import { selectDatasetData } from "@/store/slices/dataset";
import type { RankingResult } from "@/types/rankings";

export const runRankingQuery = createAsyncThunk<
  RankingResult,
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>("rankings/runRankingQuery", async (_, { getState, rejectWithValue }) => {
  const state = getState();
  const datasetContent = selectDatasetData(state)?.content;
  if (!datasetContent) {
    return rejectWithValue("No dataset is loaded.");
  }

  const activeRois = new Set(
    state.atlasUi.order.filter((id) => state.atlasUi.labelsById[id]?.enabled),
  );
  const query = state.rankings.currentQuery;
  const missingFields = getRankingQueryMissingFields(query, datasetContent);
  if (missingFields.length > 0) {
    return rejectWithValue(
      `Complete ranking fields before adding: ${missingFields.join(", ")}.`,
    );
  }
  const activeFilterMask = state.networkFilters.activeEdgeMask?.values ?? null;

  const result = computeRanking({
    datasetContent,
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
  const datasetContent = selectDatasetData(state)?.content;
  if (!datasetContent) {
    return rejectWithValue("No dataset is loaded.");
  }

  const existingResults = state.rankings.resultsOrder
    .map((id) => state.rankings.resultsById[id])
    .filter((result): result is RankingResult => Boolean(result));

  if (existingResults.length === 0) return [];

  const activeRois = new Set(
    state.atlasUi.order.filter((id) => state.atlasUi.labelsById[id]?.enabled),
  );
  const activeFilterMask = state.networkFilters.activeEdgeMask?.values ?? null;

  return existingResults.map((existing) => {
    const result = computeRanking({
      datasetContent,
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
