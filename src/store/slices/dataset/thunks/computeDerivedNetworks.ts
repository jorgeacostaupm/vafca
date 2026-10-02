import { createAsyncThunk } from '@reduxjs/toolkit'

import {
  calculateDerivedNetworks,
  type NetworkCalculationBatchRequest,
  type NetworkCalculationResult,
} from '@/networkDerivation/calculations'

import { selectDatasetContent } from '../datasetSelectors'
import { yieldToBrowser } from '../utils/browserYield'
import { assertCalculationCurrent, type DatasetCalculationConfig } from '../utils/calculationSnapshot'

export const computeDerivedNetworks = createAsyncThunk<
  NetworkCalculationResult,
  NetworkCalculationBatchRequest | NetworkCalculationBatchRequest[],
  DatasetCalculationConfig
>('dataset/computeDerivedNetworks', async (request, { getState, rejectWithValue, fulfillWithValue, signal }) => {
  const state = getState()
  const datasetRevision = state.dataset.revision
  const datasetContent = selectDatasetContent(state)
  if (!datasetContent) return rejectWithValue('No dataset is loaded.')
  const result: NetworkCalculationResult = { networks: [], warnings: [], skipped: [], existing: [] }
  for (const item of Array.isArray(request) ? request : [request]) {
    // ponytail: yield between requests; one matrix still runs synchronously. Use a worker if it stalls the UI.
    await yieldToBrowser()
    assertCalculationCurrent(getState, datasetRevision, signal)
    const calculation = calculateDerivedNetworks(item, datasetContent)
    result.networks.push(...calculation.networks)
    result.warnings.push(...calculation.warnings)
    result.skipped.push(...calculation.skipped)
    result.existing.push(...calculation.existing)
  }
  result.warnings = [...new Set(result.warnings)]
  return fulfillWithValue(result, { datasetRevision })
})
