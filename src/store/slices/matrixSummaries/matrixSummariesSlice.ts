import { createSlice } from '@reduxjs/toolkit'
import { loadMatrixSummaries } from './matrixSummariesThunks'
import { initialMatrixSummariesState } from './matrixSummariesTypes'

const matrixSummariesSlice = createSlice({
  name: 'matrixSummaries',
  initialState: initialMatrixSummariesState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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
