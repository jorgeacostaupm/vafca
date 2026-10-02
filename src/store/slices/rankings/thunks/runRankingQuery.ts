import { createAsyncThunk } from '@reduxjs/toolkit'

import { yieldToBrowser } from '@/store/slices/dataset/utils/browserYield'
import type { RankingResult } from '@/types/rankings'
import type { AppDispatch, RootState } from '@/types/store'
import { computeRanking } from '@/utils/rankings/rankingCalculations'
import { getRankingQueryMissingFields } from '@/utils/rankings/rankingQueryValidation'

import { selectRankingInputs } from '../rankingInputSelectors'

export const runRankingQuery = createAsyncThunk<
  RankingResult,
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('rankings/runRankingQuery', async (_, { getState, rejectWithValue, signal }) => {
  const state = getState()
  const inputs = selectRankingInputs(state)
  const { datasetContent, activeNodeIds, edgeMask } = inputs
  if (!datasetContent) {
    return rejectWithValue('No dataset is loaded.')
  }

  const activeNodes = new Set(activeNodeIds)
  const query = state.rankings.currentQuery
  const missingFields = getRankingQueryMissingFields(query, datasetContent)
  if (missingFields.length > 0) {
    return rejectWithValue(
      `Complete ranking fields before adding: ${missingFields.join(', ')}.`,
    )
  }
  await yieldToBrowser()
  signal.throwIfAborted()
  if (selectRankingInputs(getState()) !== inputs) {
    return rejectWithValue('Ranking inputs changed during the calculation. Run it again.')
  }
  const activeFilterMask = edgeMask?.values ?? null

  const result = computeRanking({
    datasetContent,
    query,
    activeNodes,
    activeFilterMask,
  })
  const seq = state.rankings.nextResultSeq
  return {
    ...result,
    id: `ranking-${seq}`,
    createdAt: new Date().toISOString(),
  }
}, { condition: (_, { getState }) => getState().rankings.status !== 'loading' })
