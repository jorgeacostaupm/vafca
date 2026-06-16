import { createAsyncThunk } from '@reduxjs/toolkit'

import { selectDatasetData } from '@/store/slices/dataset'
import type { NetworkSummaryItem } from '@/types/networkViewStore'
import type { RootState } from '@/types/store'
import { getDatasetNetworkSummaries } from '@/utils/datasetAccessors'

export const loadNetworkSummaries = createAsyncThunk<
  NetworkSummaryItem[],
  void,
  { state: RootState }
>('networkSummaries/loadNetworkSummaries', async (_, { getState }) => {
  return getDatasetNetworkSummaries(selectDatasetData(getState()))
})
