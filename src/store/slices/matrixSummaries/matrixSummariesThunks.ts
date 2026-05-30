import { createAsyncThunk } from '@reduxjs/toolkit'
import type { MatrixSummary } from '@/types/matrixStore'
import type { RootState } from '@/types/store'
import { selectDatasetData } from '@/store/slices/dataset'
import { getDatasetMatrixSummaries } from '@/utils/datasetAccessors'

export const loadMatrixSummaries = createAsyncThunk<
  MatrixSummary[],
  void,
  { state: RootState }
>(
  'matrixSummaries/loadMatrixSummaries',
  async (_, { getState }) => {
    return getDatasetMatrixSummaries(selectDatasetData(getState()))
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
