import { createAsyncThunk } from '@reduxjs/toolkit'

import { syncDatasetDerivedState } from '@/store/slices/dataset'
import type { RootState } from '@/types/store'

import { loadDefaultAtlasDefinition } from './loadDefaultAtlasDefinition'

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
