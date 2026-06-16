import { createAsyncThunk } from '@reduxjs/toolkit'

import { getRankingQueryMissingFields } from '@/components/rankings/rankingOptions'
import { selectDatasetContent } from '@/store/slices/dataset'
import type { RankingResult } from '@/types/rankings'
import type { AppDispatch, RootState } from '@/types/store'
import { isAtlasLabelEnabled } from '@/utils/atlas/labels'
import { computeRanking } from '@/utils/rankings/rankingCalculations'

export const runRankingQuery = createAsyncThunk<
  RankingResult,
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('rankings/runRankingQuery', async (_, { getState, rejectWithValue }) => {
  const state = getState()
  const datasetContent = selectDatasetContent(state)
  if (!datasetContent) {
    return rejectWithValue('No dataset is loaded.')
  }

  const activeNodes = new Set(
    state.atlasUi.order.filter((id) =>
      isAtlasLabelEnabled(state.atlasUi.labelsById[id]),
    ),
  )
  const query = state.rankings.currentQuery
  const missingFields = getRankingQueryMissingFields(query, datasetContent)
  if (missingFields.length > 0) {
    return rejectWithValue(
      `Complete ranking fields before adding: ${missingFields.join(', ')}.`,
    )
  }
  const activeFilterMask = state.networkFilters.activeEdgeMask?.values ?? null

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
})
