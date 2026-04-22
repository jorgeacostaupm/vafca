import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AtlasMeshMode } from '@/types/atlas'
import type { RootState } from '@/types/store'
import { syncDatasetDerivedState } from '@/store/slices/dataset'
import { clearUploadedAtlas } from './atlasDefinitionSlice'
import {
  loadDefaultAtlasDefinition,
  uploadAtlasDefinitionFromFile,
  type UploadAtlasPayload,
} from './atlasDefinitionThunks'

export const ensureDefaultAtlasDefinitionLoaded = createAsyncThunk<
  void,
  { atlasId: string },
  { state: RootState }
>(
  'atlasDefinition/ensureDefaultAtlasDefinitionLoaded',
  async ({ atlasId }, { dispatch, getState }) => {
    const state = getState()
    if (state.atlasDefinition.uploaded?.atlas) return

    const status = state.atlasDefinition.defaultStatusById[atlasId] ?? 'idle'
    if (status !== 'idle') return

    await dispatch(loadDefaultAtlasDefinition({ atlasId }))
    await dispatch(syncDatasetDerivedState())
  },
)

export const uploadAtlasDefinitionAndSync = createAsyncThunk<
  UploadAtlasPayload,
  { file: File; meshMode: AtlasMeshMode },
  { state: RootState; rejectValue: string }
>(
  'atlasDefinition/uploadAtlasDefinitionAndSync',
  async ({ file, meshMode }, { dispatch, rejectWithValue }) => {
    try {
      const result = await dispatch(
        uploadAtlasDefinitionFromFile({ file, meshMode }),
      ).unwrap()
      await dispatch(syncDatasetDerivedState())
      return result
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to upload atlas.',
      )
    }
  },
)

export const clearUploadedAtlasAndSync = createAsyncThunk<
  void,
  void,
  { state: RootState }
>('atlasDefinition/clearUploadedAtlasAndSync', async (_, { dispatch, getState }) => {
  dispatch(clearUploadedAtlas())

  const state = getState()
  const atlasId = state.dataset.data?.metadata.atlasId ?? state.dataset.data?.metadata.atlas
  const status = atlasId
    ? (state.atlasDefinition.defaultStatusById[atlasId] ?? 'idle')
    : 'idle'

  if (atlasId && status === 'idle') {
    await dispatch(loadDefaultAtlasDefinition({ atlasId }))
  }
  await dispatch(syncDatasetDerivedState())
})
