import { createSlice } from '@reduxjs/toolkit'
import {
  clearDataset,
  loadTestDataset,
  uploadMatricesIntoDataset,
} from '@/store/slices/dataset'
import { fetchMatricesByCompoundIds } from './matrixCacheThunks'
import { initialMatrixCacheState } from './matrixCacheTypes'

const matrixCacheSlice = createSlice({
  name: 'matrixCache',
  initialState: initialMatrixCacheState,
  reducers: {
    clearMatrixCache(state) {
      state.byCompoundId = {}
      state.loadingByCompoundId = {}
      state.errorByCompoundId = {}
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTestDataset.pending, (state) => {
        state.byCompoundId = {}
        state.loadingByCompoundId = {}
        state.errorByCompoundId = {}
      })
      .addCase(clearDataset, (state) => {
        state.byCompoundId = {}
        state.loadingByCompoundId = {}
        state.errorByCompoundId = {}
      })
      .addCase(uploadMatricesIntoDataset.fulfilled, (state) => {
        state.byCompoundId = {}
        state.loadingByCompoundId = {}
        state.errorByCompoundId = {}
      })
      .addCase(fetchMatricesByCompoundIds.pending, (state, action) => {
        const ids = Array.from(new Set(action.meta.arg.compoundIds.filter(Boolean)))
        ids.forEach((compoundId) => {
          if (compoundId in state.byCompoundId) return
          state.loadingByCompoundId[compoundId] = true
          state.errorByCompoundId[compoundId] = null
        })
      })
      .addCase(fetchMatricesByCompoundIds.fulfilled, (state, action) => {
        action.payload.forEach(({ compoundId, matrix, error }) => {
          state.byCompoundId[compoundId] = matrix
          state.loadingByCompoundId[compoundId] = false
          state.errorByCompoundId[compoundId] = error ?? null
        })
      })
      .addCase(fetchMatricesByCompoundIds.rejected, (state, action) => {
        const error = action.error.message ?? 'Failed to load matrix.'
        const ids = Array.from(new Set(action.meta.arg.compoundIds.filter(Boolean)))
        ids.forEach((compoundId) => {
          state.loadingByCompoundId[compoundId] = false
          if (!(compoundId in state.byCompoundId)) {
            state.byCompoundId[compoundId] = null
          }
          state.errorByCompoundId[compoundId] = error
        })
      })
  },
})

export const { clearMatrixCache } = matrixCacheSlice.actions

export default matrixCacheSlice.reducer
