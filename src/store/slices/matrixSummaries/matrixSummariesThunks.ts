import { createAsyncThunk } from '@reduxjs/toolkit'
import { getAllMatrixSummaries } from '@/utils/matrixStore'
import type { MatrixSummary } from '@/types/matrixStore'
import type { RootState } from '@/types/store'

export const loadMatrixSummaries = createAsyncThunk<MatrixSummary[]>(
  'matrixSummaries/loadMatrixSummaries',
  async () => {
    return getAllMatrixSummaries()
  },
)

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
