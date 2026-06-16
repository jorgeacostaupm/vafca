import { createSlice } from '@reduxjs/toolkit'

import {
  clearDataset,
  computeDerivedNetworks,
  loadDatasetFromUploadedZip,
  loadInitialDataset,
} from '@/store/slices/dataset'

import { initialNetworkSummariesState } from './networkSummariesTypes'
import { loadNetworkSummaries } from './thunks/loadNetworkSummaries'

const networkSummariesSlice = createSlice({
  name: 'networkSummaries',
  initialState: initialNetworkSummariesState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(clearDataset, (state) => {
        state.summaries = []
        state.status = 'idle'
        state.error = null
      })
      .addCase(loadInitialDataset.pending, (state) => {
        state.summaries = []
        state.status = 'idle'
        state.error = null
      })
      .addCase(loadDatasetFromUploadedZip.fulfilled, (state) => {
        state.summaries = []
        state.status = 'idle'
        state.error = null
      })
      .addCase(computeDerivedNetworks.fulfilled, (state) => {
        state.summaries = []
        state.status = 'idle'
        state.error = null
      })
      .addCase(loadNetworkSummaries.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadNetworkSummaries.fulfilled, (state, action) => {
        state.status = 'ready'
        state.summaries = action.payload
        state.error = null
      })
      .addCase(loadNetworkSummaries.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.error.message ?? 'Failed to load networks.'
      })
  },
})

export default networkSummariesSlice.reducer
