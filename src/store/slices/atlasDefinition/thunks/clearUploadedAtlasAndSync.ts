import { createAsyncThunk } from '@reduxjs/toolkit'

import { selectDatasetData, syncDatasetDerivedState } from '@/store/slices/dataset'
import type { RootState } from '@/types/store'
import { getDatasetAtlasId } from '@/utils/datasetAccessors'

import { clearUploadedAtlas } from '../atlasDefinitionSlice'
import { loadDefaultAtlasDefinition } from './loadDefaultAtlasDefinition'

export const clearUploadedAtlasAndSync = createAsyncThunk<
  void,
  void,
  { state: RootState }
>('atlasDefinition/clearUploadedAtlasAndSync', async (_, { dispatch, getState }) => {
  dispatch(clearUploadedAtlas())

  const state = getState()
  const atlasId = getDatasetAtlasId(selectDatasetData(state))
  if (atlasId) await dispatch(loadDefaultAtlasDefinition({ atlasId }))
  await dispatch(syncDatasetDerivedState())
})
