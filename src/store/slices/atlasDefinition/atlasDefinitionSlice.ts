import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { AtlasSource } from '@/types/atlas'

import { initialAtlasDefinitionState } from './atlasDefinitionTypes'
import {
  loadDefaultAtlasDefinition,
  uploadAtlasDefinitionFromFile,
} from './thunks'

const DEFAULT_ATLAS_STATUS_ID = '__default_atlas__'

const atlasDefinitionSlice = createSlice({
  name: 'atlasDefinition',
  initialState: initialAtlasDefinitionState,
  reducers: {
    setUploadedAtlas(state, action: PayloadAction<AtlasSource>) {
      state.uploaded = action.payload
      state.uploadStatus = 'ready'
      state.uploadError = null
    },
    clearUploadedAtlas(state) {
      state.uploaded = null
      state.uploadStatus = 'idle'
      state.uploadError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDefaultAtlasDefinition.pending, (state, action) => {
        const atlasId = action.meta.arg?.atlasId ?? DEFAULT_ATLAS_STATUS_ID
        state.defaultStatusById[atlasId] = 'loading'
        state.defaultErrorById[atlasId] = null
      })
      .addCase(loadDefaultAtlasDefinition.fulfilled, (state, action) => {
        const { atlasId, requestedAtlasId, atlas } = action.payload
        state.defaultById[atlasId] = atlas
        state.defaultStatusById[atlasId] = 'ready'
        state.defaultErrorById[atlasId] = null
        if (requestedAtlasId && requestedAtlasId !== atlasId) {
          state.defaultById[requestedAtlasId] = atlas
          state.defaultStatusById[requestedAtlasId] = 'ready'
          state.defaultErrorById[requestedAtlasId] = null
        }
      })
      .addCase(loadDefaultAtlasDefinition.rejected, (state, action) => {
        const atlasId =
          action.payload?.atlasId ??
          action.meta.arg?.atlasId ??
          DEFAULT_ATLAS_STATUS_ID
        const error =
          action.payload?.error ?? action.error.message ?? 'Failed to load atlas.'
        state.defaultById[atlasId] = null
        state.defaultStatusById[atlasId] = 'error'
        state.defaultErrorById[atlasId] = error
      })
      .addCase(uploadAtlasDefinitionFromFile.pending, (state) => {
        state.uploadStatus = 'loading'
        state.uploadError = null
      })
      .addCase(uploadAtlasDefinitionFromFile.fulfilled, (state, action) => {
        const { atlas, fileName } = action.payload
        state.uploaded = {
          atlas,
          fileName,
        }
        state.uploadStatus = 'ready'
        state.uploadError = null
      })
      .addCase(uploadAtlasDefinitionFromFile.rejected, (state, action) => {
        state.uploadStatus = 'error'
        state.uploadError =
          action.payload?.error ?? action.error.message ?? 'Failed to upload atlas.'
      })
  },
})

export const { setUploadedAtlas, clearUploadedAtlas } = atlasDefinitionSlice.actions

export default atlasDefinitionSlice.reducer
