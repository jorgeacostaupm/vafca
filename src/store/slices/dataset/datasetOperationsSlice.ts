import { createSlice, isAnyOf } from '@reduxjs/toolkit'

import { initialDatasetOperationsState } from './datasetOperationsTypes'
import { clearDataset, setDataset } from './datasetSlice'
import { computeAggregatedNetworkFromVisualizationGroups } from './thunks/computeAggregatedNetworks'
import { computeDerivedNetworks } from './thunks/computeDerivedNetworks'
import { downloadCurrentDataset } from './thunks/exportDataset'
import { loadInitialDataset } from './thunks/loadInitialDataset'
import { recomputeAggregatedNetworksForActiveNodes } from './thunks/recomputeAggregatedNetworksForActiveNodes'
import { loadDatasetFromUploadedZip } from './thunks/uploadDataset'

const getRejectedMessage = (
  action: { payload?: unknown; error: { message?: string } },
  fallback: string,
) => (typeof action.payload === 'string' ? action.payload : action.error.message ?? fallback)

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
        state.derivedCalculationRequestIds = []
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
      .addMatcher(isAnyOf(setDataset, clearDataset), state => {
        state.derivedCalculationRequestIds = []
        state.derivedCalculationStatus = 'idle'
        state.derivedCalculationError = null
      })
      .addMatcher(isAnyOf(computeDerivedNetworks.pending,
        computeAggregatedNetworkFromVisualizationGroups.pending,
        recomputeAggregatedNetworksForActiveNodes.pending), (state, action) => {
        if (!state.derivedCalculationRequestIds.length) state.derivedCalculationError = null
        state.derivedCalculationRequestIds.push(action.meta.requestId)
        state.derivedCalculationStatus = 'loading'
      })
      .addMatcher(isAnyOf(computeDerivedNetworks.fulfilled,
        computeAggregatedNetworkFromVisualizationGroups.fulfilled,
        recomputeAggregatedNetworksForActiveNodes.fulfilled), (state, action) => {
        if (!state.derivedCalculationRequestIds.includes(action.meta.requestId)) return
        state.derivedCalculationRequestIds = state.derivedCalculationRequestIds.filter(id => id !== action.meta.requestId)
        state.derivedCalculationStatus = state.derivedCalculationRequestIds.length
          ? 'loading' : state.derivedCalculationError ? 'error' : 'ready'
      })
      .addMatcher(isAnyOf(computeDerivedNetworks.rejected,
        computeAggregatedNetworkFromVisualizationGroups.rejected,
        recomputeAggregatedNetworksForActiveNodes.rejected), (state, action) => {
        if (!state.derivedCalculationRequestIds.includes(action.meta.requestId)) return
        state.derivedCalculationRequestIds = state.derivedCalculationRequestIds.filter(id => id !== action.meta.requestId)
        if (!action.meta.aborted) {
          state.derivedCalculationError = getRejectedMessage(action, 'Failed to compute networks.')
        }
        state.derivedCalculationStatus = state.derivedCalculationRequestIds.length
          ? 'loading' : state.derivedCalculationError ? 'error' : 'idle'
      })
  },
})

export const { resetDatasetOperations } = datasetOperationsSlice.actions
export default datasetOperationsSlice.reducer
