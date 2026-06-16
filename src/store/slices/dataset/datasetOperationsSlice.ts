import { createSlice } from '@reduxjs/toolkit'

import { initialDatasetOperationsState } from './datasetOperationsTypes'
import { computeAggregatedNetworkFromVisualizationGroups } from './thunks/computeAggregatedNetworks'
import { computeDerivedNetworks } from './thunks/computeDerivedNetworks'
import { downloadCurrentDataset } from './thunks/exportDataset'
import { loadInitialDataset } from './thunks/loadInitialDataset'
import { loadDatasetFromUploadedZip } from './thunks/uploadDataset'

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
        state.networkImportStatus = 'idle'
        state.networkImportError = null
        state.lastNetworkImport = null
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
        state.downloadError = action.payload ?? action.error.message ?? 'Failed to export dataset.'
      })
      .addCase(loadDatasetFromUploadedZip.pending, (state) => {
        state.networkImportStatus = 'loading'
        state.networkImportError = null
        state.lastNetworkImport = null
      })
      .addCase(loadDatasetFromUploadedZip.fulfilled, (state, action) => {
        state.status = 'ready'
        state.error = null
        state.networkImportStatus = 'ready'
        state.networkImportError = null
        state.lastNetworkImport = {
          files: action.payload.files,
          validNetworks: action.payload.validNetworks,
          invalidNetworks: action.payload.invalidNetworks,
          errors: action.payload.errors,
          warnings: action.payload.warnings,
        }
      })
      .addCase(loadDatasetFromUploadedZip.rejected, (state, action) => {
        state.networkImportStatus = 'error'
        state.networkImportError =
          action.payload?.message ?? action.error.message ?? 'Failed to import networks.'
        state.lastNetworkImport = action.payload?.result ?? null
      })
      .addCase(computeDerivedNetworks.pending, (state) => {
        state.derivedCalculationStatus = 'loading'
        state.derivedCalculationError = null
      })
      .addCase(computeDerivedNetworks.fulfilled, (state) => {
        state.derivedCalculationStatus = 'ready'
        state.derivedCalculationError = null
      })
      .addCase(computeDerivedNetworks.rejected, (state, action) => {
        state.derivedCalculationStatus = 'error'
        state.derivedCalculationError =
          action.payload ?? action.error.message ?? 'Failed to compute derived networks.'
      })
      .addCase(computeAggregatedNetworkFromVisualizationGroups.pending, (state) => {
        state.derivedCalculationStatus = 'loading'
        state.derivedCalculationError = null
      })
      .addCase(computeAggregatedNetworkFromVisualizationGroups.fulfilled, (state) => {
        state.derivedCalculationStatus = 'ready'
        state.derivedCalculationError = null
      })
      .addCase(computeAggregatedNetworkFromVisualizationGroups.rejected, (state, action) => {
        state.derivedCalculationStatus = 'error'
        state.derivedCalculationError =
          action.payload ?? action.error.message ?? 'Failed to compute aggregated network.'
      })
  },
})

export const { resetDatasetOperations } = datasetOperationsSlice.actions
export default datasetOperationsSlice.reducer
