import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { catalogItemUpdated } from '@/store/actions/catalogItemUpdated'
import { updateRoiMetadata } from '@/store/actions/updateRoiMetadata'
import type {
  DatasetMeta,
  UpdateCatalogPayload,
} from '@/types/datasetState'

import { initialDatasetState } from './datasetTypes'
import {
  computeAggregatedNetworkFromVisualizationGroups,
} from './thunks/computeAggregatedNetworks'
import { computeDerivedNetworks } from './thunks/computeDerivedNetworks'
import { recomputeAggregatedNetworksForActiveNodes } from './thunks/recomputeAggregatedNetworksForActiveNodes'
import { updateDatasetCatalogItem } from './utils/catalogUpdate'
import { hydrateDatasetStateFromContent } from './utils/datasetHydration'
import { networksAdapter } from './utils/networksAdapter'
import { registerGeneratedNetworksInDataset } from './utils/registerGeneratedNetworks'

const datasetSlice = createSlice({
  name: 'dataset',
  initialState: initialDatasetState,
  reducers: {
    setDataset(state, action: PayloadAction<DatasetMeta>) {
      state.revision += 1
      hydrateDatasetStateFromContent(state, action.payload.content)
    },
    clearDataset(state) {
      state.revision += 1
      state.id = null
      state.label = null
      state.description = null
      state.createdAt = null
      state.nodeSet = null
      state.catalogs = null
      networksAdapter.removeAll(state.networks)
    },
    updateCatalogItem(state, action: PayloadAction<UpdateCatalogPayload>) {
      if (!state.catalogs) return
      updateDatasetCatalogItem(state.catalogs, action.payload)
      state.revision += 1
    },
    removeDatasetNetworks(state, action: PayloadAction<{ networkIds: string[] }>) {
      state.revision += 1
      networksAdapter.removeMany(state.networks, action.payload.networkIds)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(catalogItemUpdated, (state, { payload }) => {
        if (!state.catalogs) return
        updateDatasetCatalogItem(state.catalogs, payload.update)
        state.revision += 1
      })
      .addCase(updateRoiMetadata, (state, { payload }) => {
        if (state.nodeSet?.id !== payload.nodeSetId) return
        const node = state.nodeSet?.nodes.find((node) => node.id === payload.id)
        if (node) {
          node.metadata = payload.metadata
          state.revision += 1
        }
      })
      .addCase(computeDerivedNetworks.fulfilled, (state, action) => {
        if (action.meta.datasetRevision !== state.revision) return
        if (!state.catalogs || action.payload.networks.length === 0) return
        registerGeneratedNetworksInDataset(state, action.payload.networks)
      })
      .addCase(computeAggregatedNetworkFromVisualizationGroups.fulfilled, (state, action) => {
        if (action.meta.datasetRevision !== state.revision) return
        const networks = action.payload.networks
        if (!state.catalogs || networks.length === 0) return
        registerGeneratedNetworksInDataset(state, networks)
      })
      .addCase(recomputeAggregatedNetworksForActiveNodes.fulfilled, (state, action) => {
        if (action.meta.datasetRevision !== state.revision) return
        const networks = action.payload.networks
        if (!state.catalogs || networks.length === 0) return
        registerGeneratedNetworksInDataset(state, networks)
      })
  },
})

export const {
  setDataset,
  clearDataset,
  removeDatasetNetworks,
  updateCatalogItem,
} =
  datasetSlice.actions

export default datasetSlice.reducer
