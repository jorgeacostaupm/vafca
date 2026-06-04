import { createAsyncThunk } from '@reduxjs/toolkit'

import type { RootState } from '@/types/store'

import { loadMatrixSummaries } from './loadMatrixSummaries'

export const ensureMatrixSummariesLoaded = createAsyncThunk<
  void,
  { force?: boolean } | void,
  { state: RootState }
>(
  'matrixSummaries/ensureMatrixSummariesLoaded',
  async (payload, { dispatch, getState }) => {
    const force = payload?.force ?? false
    const status = getState().matrixSummaries.status
    if (!force && (status === 'loading' || status === 'ready')) {
      return
    }
    await dispatch(loadMatrixSummaries())
  },
)
