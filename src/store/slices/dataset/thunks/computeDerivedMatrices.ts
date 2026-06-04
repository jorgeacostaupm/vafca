import { createAsyncThunk } from '@reduxjs/toolkit'

import {
  calculateDerivedMatrices,
  type MatrixCalculationBatchRequest,
  type MatrixCalculationResult,
} from '@/networkDerivation/calculations'
import type { RootState } from '@/types/store'

import { selectDatasetContent } from '../datasetSelectors'
import { yieldToBrowser } from '../utils/browserYield'

export const computeDerivedMatrices = createAsyncThunk<
  MatrixCalculationResult,
  MatrixCalculationBatchRequest,
  { state: RootState; rejectValue: string }
>('dataset/computeDerivedMatrices', async (request, { getState, rejectWithValue }) => {
  const datasetContent = selectDatasetContent(getState())
  if (!datasetContent) return rejectWithValue('No dataset is loaded.')
  await yieldToBrowser()
  return calculateDerivedMatrices(request, datasetContent)
})
