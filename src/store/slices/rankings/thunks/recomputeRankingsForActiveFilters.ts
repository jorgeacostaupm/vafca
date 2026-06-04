import { createAsyncThunk } from '@reduxjs/toolkit'

import { selectDatasetContent } from '@/store/slices/dataset'
import type { RankingResult } from '@/types/rankings'
import type { AppDispatch, RootState } from '@/types/store'
import { isAtlasLabelEnabled } from '@/utils/atlas/labels'
import { computeRanking } from '@/utils/rankings/rankingCalculations'

export const recomputeRankingsForActiveFilters = createAsyncThunk<
  RankingResult[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  'rankings/recomputeRankingsForActiveFilters',
  async (_, { getState, rejectWithValue }) => {
    const state = getState()
    const datasetContent = selectDatasetContent(state)
    if (!datasetContent) {
      return rejectWithValue('No dataset is loaded.')
    }

    const existingResults = state.rankings.resultsOrder
      .map((id) => state.rankings.resultsById[id])
      .filter((result): result is RankingResult => Boolean(result))

    if (existingResults.length === 0) return []

    const activeRois = new Set(
      state.atlasUi.order.filter((id) =>
        isAtlasLabelEnabled(state.atlasUi.labelsById[id]),
      ),
    )
    const activeFilterMask = state.networkFilters.activeEdgeMask?.values ?? null

    return existingResults.map((existing) => {
      const result = computeRanking({
        datasetContent,
        query: existing.query,
        activeRois,
        activeFilterMask,
      })
      return {
        ...result,
        id: existing.id,
        createdAt: existing.createdAt,
      }
    })
  },
)
