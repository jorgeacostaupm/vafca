import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type {
  DatasetMeta,
  UpdateCatalogPayload,
} from '@/types/datasetState'

import { initialDatasetState } from './datasetTypes'
import {
  computeAggregatedMatrixFromVisualizationGroups,
} from './thunks/computeAggregatedMatrices'
import { computeDerivedMatrices } from './thunks/computeDerivedMatrices'
import { recomputeAggregatedMatricesForActiveRois } from './thunks/recomputeAggregatedMatricesForActiveRois'
import { updateDatasetCatalogItem } from './utils/catalogUpdate'
import { hydrateDatasetStateFromContent } from './utils/datasetHydration'
import { matricesAdapter } from './utils/matricesAdapter'
import { registerGeneratedMatricesInDataset } from './utils/registerGeneratedMatrices'

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
    removeDatasetMatrices(state, action: PayloadAction<{ matrixIds: string[] }>) {
      matricesAdapter.removeMany(state.matrices, action.payload.matrixIds)
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
      .addCase(recomputeAggregatedMatricesForActiveRois.fulfilled, (state, action) => {
        const matrices = action.payload.matrices
        if (!state.catalogs || matrices.length === 0) return
        registerGeneratedMatricesInDataset(state, matrices)
      })
  },
})

export const {
  setDataset,
  clearDataset,
  removeDatasetMatrices,
  updateCatalogItem,
} =
  datasetSlice.actions

export default datasetSlice.reducer
