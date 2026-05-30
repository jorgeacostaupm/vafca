import { createSlice } from '@reduxjs/toolkit'
import {
  computeAggregatedMatrixFromVisualizationGroups,
  computeDerivedMatrices,
  downloadCurrentDataset,
  loadInitialDataset,
  loadDatasetFromUploadedZip,
} from './datasetThunks'
import { initialDatasetOperationsState } from './datasetOperationsTypes'

const datasetOperationsSlice = createSlice({
  name: 'datasetOperations',
  initialState: initialDatasetOperationsState,
  reducers: {
    resetDatasetOperations() {
      return initialDatasetOperationsState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadInitialDataset.pending, (state) => {
        state.status = 'loading'
        state.error = null
        state.downloadStatus = 'idle'
        state.downloadError = null
        state.matrixUploadStatus = 'idle'
        state.matrixUploadError = null
        state.lastMatrixUpload = null
        state.derivedCalculationStatus = 'idle'
        state.derivedCalculationError = null
      })
      .addCase(loadInitialDataset.fulfilled, (state) => {
        state.status = 'ready'
        state.downloadStatus = 'idle'
        state.downloadError = null
      })
      .addCase(loadInitialDataset.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.error.message ?? 'Failed to load dataset.'
      })
      .addCase(downloadCurrentDataset.pending, (state) => {
        state.downloadStatus = 'loading'
        state.downloadError = null
      })
      .addCase(downloadCurrentDataset.fulfilled, (state) => {
        state.downloadStatus = 'ready'
        state.downloadError = null
      })
      .addCase(downloadCurrentDataset.rejected, (state, action) => {
        state.downloadStatus = 'error'
        state.downloadError =
          action.payload ?? action.error.message ?? 'Failed to export dataset.'
      })
      .addCase(loadDatasetFromUploadedZip.pending, (state) => {
        state.matrixUploadStatus = 'loading'
        state.matrixUploadError = null
        state.lastMatrixUpload = null
      })
      .addCase(loadDatasetFromUploadedZip.fulfilled, (state, action) => {
        state.status = 'ready'
        state.error = null
        state.matrixUploadStatus = 'ready'
        state.matrixUploadError = null
        state.lastMatrixUpload = {
          files: action.payload.files,
          validMatrices: action.payload.validMatrices,
          invalidMatrices: action.payload.invalidMatrices,
          errors: action.payload.errors,
          warnings: action.payload.warnings,
        }
      })
      .addCase(loadDatasetFromUploadedZip.rejected, (state, action) => {
        state.matrixUploadStatus = 'error'
        state.matrixUploadError =
          action.payload?.message ??
          action.error.message ??
          'Failed to upload matrices.'
        state.lastMatrixUpload = action.payload?.result ?? null
      })
      .addCase(computeDerivedMatrices.pending, (state) => {
        state.derivedCalculationStatus = 'loading'
        state.derivedCalculationError = null
      })
      .addCase(computeDerivedMatrices.fulfilled, (state) => {
        state.derivedCalculationStatus = 'ready'
        state.derivedCalculationError = null
      })
      .addCase(computeDerivedMatrices.rejected, (state, action) => {
        state.derivedCalculationStatus = 'error'
        state.derivedCalculationError =
          action.payload ?? action.error.message ?? 'Failed to compute derived matrices.'
      })
      .addCase(computeAggregatedMatrixFromVisualizationGroups.pending, (state) => {
        state.derivedCalculationStatus = 'loading'
        state.derivedCalculationError = null
      })
      .addCase(computeAggregatedMatrixFromVisualizationGroups.fulfilled, (state) => {
        state.derivedCalculationStatus = 'ready'
        state.derivedCalculationError = null
      })
      .addCase(computeAggregatedMatrixFromVisualizationGroups.rejected, (state, action) => {
        state.derivedCalculationStatus = 'error'
        state.derivedCalculationError =
          action.payload ?? action.error.message ?? 'Failed to compute aggregated matrix.'
      })
  },
})

export const { resetDatasetOperations } = datasetOperationsSlice.actions
export default datasetOperationsSlice.reducer
