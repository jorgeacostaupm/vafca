import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  DatasetMeta,
  UpdateCatalogPayload,
  UpdateMetadataPayload,
} from '@/types/datasetState'
import { downloadCurrentDataset, loadTestDataset } from './datasetThunks'
import { initialDatasetState } from './datasetTypes'

const datasetSlice = createSlice({
  name: 'dataset',
  initialState: initialDatasetState,
  reducers: {
    setDataset(state, action: PayloadAction<DatasetMeta>) {
      state.data = action.payload
      state.status = 'ready'
      state.error = null
      state.downloadStatus = 'idle'
      state.downloadError = null
    },
    clearDataset(state) {
      state.data = null
      state.status = 'idle'
      state.error = null
      state.downloadStatus = 'idle'
      state.downloadError = null
    },
    updateCatalogItem(state, action: PayloadAction<UpdateCatalogPayload>) {
      if (!state.data) return
      const { catalog, id, changes } = action.payload
      const catalogMap = state.data.catalogs[catalog] as Record<
        string,
        Record<string, unknown>
      >
      const existing = catalogMap[id]
      if (!existing) return
      catalogMap[id] = { ...existing, ...changes }
    },
    updateMetadata(state, action: PayloadAction<UpdateMetadataPayload>) {
      if (!state.data) return
      state.data.metadata = { ...state.data.metadata, ...action.payload.changes }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTestDataset.pending, (state) => {
        state.status = 'loading'
        state.error = null
        state.downloadStatus = 'idle'
        state.downloadError = null
      })
      .addCase(loadTestDataset.fulfilled, (state, action) => {
        state.status = 'ready'
        state.data = action.payload
        state.downloadStatus = 'idle'
        state.downloadError = null
      })
      .addCase(loadTestDataset.rejected, (state, action) => {
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
  },
})

export const { setDataset, clearDataset, updateCatalogItem, updateMetadata } =
  datasetSlice.actions

export default datasetSlice.reducer
