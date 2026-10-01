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
  NetworkCalculationBatchRequest | NetworkCalculationBatchRequest[],
  { state: RootState; rejectValue: string }
>('dataset/computeDerivedNetworks', async (request, { getState, rejectWithValue }) => {
  const datasetContent = selectDatasetContent(getState())
  if (!datasetContent) return rejectWithValue('No dataset is loaded.')
  await yieldToBrowser()
  const result: NetworkCalculationResult = { networks: [], warnings: [], skipped: [], existing: [] }
  for (const item of Array.isArray(request) ? request : [request]) {
    const calculation = calculateDerivedNetworks(item, datasetContent)
    result.networks.push(...calculation.networks)
    result.warnings.push(...calculation.warnings)
    result.skipped.push(...calculation.skipped)
    result.existing.push(...calculation.existing)
  }
  result.warnings = [...new Set(result.warnings)]
  return result
})
