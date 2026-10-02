import { createAsyncThunk } from '@reduxjs/toolkit'

import { yieldToBrowser } from '@/store/slices/dataset/utils/browserYield'
import type { RankingResult } from '@/types/rankings'
import type { AppDispatch, RootState } from '@/types/store'
import { computeRanking } from '@/utils/rankings/rankingCalculations'

import { selectRankingInputs } from '../rankingInputSelectors'

export const recomputeRankingsForActiveFilters = createAsyncThunk<
  RankingResult[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  'rankings/recomputeRankingsForActiveFilters',
  async (_, { getState, rejectWithValue, signal }) => {
    const state = getState()
    const inputs = selectRankingInputs(state)
    const { datasetContent, activeNodeIds, edgeMask } = inputs
    if (!datasetContent) {
      return rejectWithValue('No dataset is loaded.')
    }

    const existingResults = state.rankings.resultsOrder
      .map((id) => state.rankings.resultsById[id])
      .filter((result): result is RankingResult => Boolean(result))

    if (existingResults.length === 0) return []

    const activeNodes = new Set(activeNodeIds)
    const activeFilterMask = edgeMask?.values ?? null
    const results: RankingResult[] = []
    for (const existing of existingResults) {
      // ponytail: yield between rankings; move individual calculations to a worker if they stall the UI.
      await yieldToBrowser()
      signal.throwIfAborted()
      if (selectRankingInputs(getState()) !== inputs) {
        return rejectWithValue('Ranking inputs changed during the calculation.')
      }
      const result = computeRanking({
        datasetContent,
        query: existing.query,
        activeNodes,
        activeFilterMask,
      })
      results.push({
        ...result,
        id: existing.id,
        createdAt: existing.createdAt,
      })
    }
    return results
  },
)
