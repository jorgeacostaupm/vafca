import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AtlasSource } from '@/types/atlas'
import {
  loadDefaultAtlasDefinition,
  uploadAtlasDefinitionFromFile,
} from './atlasDefinitionThunks'
import { initialAtlasDefinitionState } from './atlasDefinitionTypes'

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
        const { atlasId } = action.meta.arg
        state.defaultStatusById[atlasId] = 'loading'
        state.defaultErrorById[atlasId] = null
      })
      .addCase(loadDefaultAtlasDefinition.fulfilled, (state, action) => {
        const { atlasId, atlas } = action.payload
        state.defaultById[atlasId] = atlas
        state.defaultStatusById[atlasId] = 'ready'
        state.defaultErrorById[atlasId] = null
      })
      .addCase(loadDefaultAtlasDefinition.rejected, (state, action) => {
        const { atlasId } = action.payload ?? action.meta.arg
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
        const { atlas, fileName, meshMode } = action.payload
        state.uploaded = {
          atlas,
          fileName,
          meshMode,
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
