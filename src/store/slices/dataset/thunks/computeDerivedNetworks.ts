import { createAsyncThunk } from '@reduxjs/toolkit'

import {
  calculateDerivedNetworks,
  type NetworkCalculationBatchRequest,
  type NetworkCalculationResult,
} from '@/networkDerivation/calculations'
import type { RootState } from '@/types/store'

import { selectDatasetContent } from '../datasetSelectors'
import { yieldToBrowser } from '../utils/browserYield'

export const computeDerivedNetworks = createAsyncThunk<
  NetworkCalculationResult,
  NetworkCalculationBatchRequest,
  { state: RootState; rejectValue: string }
>('dataset/computeDerivedNetworks', async (request, { getState, rejectWithValue }) => {
  const datasetContent = selectDatasetContent(getState())
  if (!datasetContent) return rejectWithValue('No dataset is loaded.')
  await yieldToBrowser()
  return calculateDerivedNetworks(request, datasetContent)
})
