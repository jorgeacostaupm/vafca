import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  DatasetMeta,
  UpdateCatalogPayload,
} from '@/types/datasetState'
import {
  computeAggregatedMatrixFromVisualizationGroups,
  computeDerivedMatrices,
} from './datasetThunks'
import { initialDatasetState } from './datasetTypes'
import { matricesAdapter } from './matricesAdapter'
import { registerGeneratedMatricesInDataset } from './registerGeneratedMatrices'
import { hydrateDatasetStateFromContent } from './datasetHydration'
import { updateDatasetCatalogItem } from './catalogUpdate'

const datasetSlice = createSlice({
  name: 'dataset',
  initialState: initialDatasetState,
  reducers: {
    setDataset(state, action: PayloadAction<DatasetMeta>) {
      hydrateDatasetStateFromContent(state, action.payload.content)
    },
    clearDataset(state) {
      state.schemaVersion = null
      state.loadedBundle = null
      state.atlas = null
      state.roiOrderHash = null
      state.catalogs = null
      matricesAdapter.removeAll(state.matrices)
    },
    updateCatalogItem(state, action: PayloadAction<UpdateCatalogPayload>) {
      if (!state.catalogs) return
      updateDatasetCatalogItem(state.catalogs, action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(computeDerivedMatrices.fulfilled, (state, action) => {
        if (!state.catalogs || action.payload.matrices.length === 0) return
        registerGeneratedMatricesInDataset(state, action.payload.matrices)
      })
      .addCase(computeAggregatedMatrixFromVisualizationGroups.fulfilled, (state, action) => {
        const matrices = action.payload.matrices
        if (!state.catalogs || matrices.length === 0) return
        registerGeneratedMatricesInDataset(state, matrices)
      })
  },
})

export const {
  setDataset,
  clearDataset,
  updateCatalogItem,
} =
  datasetSlice.actions

export default datasetSlice.reducer
