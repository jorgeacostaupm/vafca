import { createAsyncThunk } from '@reduxjs/toolkit'

import { selectDatasetData } from '@/store/slices/dataset'
import type { MatrixSummary } from '@/types/matrixStore'
import type { RootState } from '@/types/store'
import { getDatasetMatrixSummaries } from '@/utils/datasetAccessors'

export const loadMatrixSummaries = createAsyncThunk<
  MatrixSummary[],
  void,
  { state: RootState }
>('matrixSummaries/loadMatrixSummaries', async (_, { getState }) => {
  return getDatasetMatrixSummaries(selectDatasetData(getState()))
})
