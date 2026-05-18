import { createSlice } from '@reduxjs/toolkit'
import {
  clearDataset,
  computeDerivedMatrices,
  loadTestDataset,
  uploadMatricesIntoDataset,
} from '@/store/slices/dataset'
import { loadMatrixSummaries } from './matrixSummariesThunks'
import { initialMatrixSummariesState } from './matrixSummariesTypes'

const matrixSummariesSlice = createSlice({
  name: 'matrixSummaries',
  initialState: initialMatrixSummariesState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(clearDataset, (state) => {
        state.summaries = []
        state.status = 'idle'
        state.error = null
      })
      .addCase(loadTestDataset.pending, (state) => {
        state.summaries = []
        state.status = 'idle'
        state.error = null
      })
      .addCase(uploadMatricesIntoDataset.fulfilled, (state) => {
        state.summaries = []
        state.status = 'idle'
        state.error = null
      })
      .addCase(computeDerivedMatrices.fulfilled, (state) => {
        state.summaries = []
        state.status = 'idle'
        state.error = null
      })
      .addCase(loadMatrixSummaries.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadMatrixSummaries.fulfilled, (state, action) => {
        state.status = 'ready'
        state.summaries = action.payload
        state.error = null
      })
      .addCase(loadMatrixSummaries.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.error.message ?? 'Failed to load matrices.'
      })
  },
})

export default matrixSummariesSlice.reducer
