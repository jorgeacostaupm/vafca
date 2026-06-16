import { createAsyncThunk } from '@reduxjs/toolkit'

import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlasUi'
import { selectDatasetData, syncDatasetDerivedState } from '@/store/slices/dataset'
import type { RootState } from '@/types/store'
import { buildNodeDerivedAtlasSource } from '@/utils/atlas/nodeDerivedAtlas'
import { checkAtlasNodeCompatibility } from '@/utils/atlasCompatibility'
import { getDatasetNodeOrder } from '@/utils/datasetAccessors'
import { normalizeNodeOrder } from '@/utils/nodeOrder'

import { setUploadedAtlas } from '../atlasDefinitionSlice'
import { getUploadAtlasErrorMessage } from '../utils/atlasDefinitionThunkUtils'
import {
  uploadAtlasDefinitionFromFile,
  type UploadAtlasPayload,
} from './uploadAtlasDefinitionFromFile'

export const uploadAtlasDefinitionAndSync = createAsyncThunk<
  UploadAtlasPayload,
  { file: File },
  { state: RootState; rejectValue: string }
>(
  'atlasDefinition/uploadAtlasDefinitionAndSync',
  async ({ file }, { dispatch, getState, rejectWithValue }) => {
    try {
      const result = await dispatch(uploadAtlasDefinitionFromFile({ file })).unwrap()

      const nodeOrder = getDatasetNodeOrder(selectDatasetData(getState()))
      const compatibility = checkAtlasNodeCompatibility(nodeOrder, result.atlas)
      if (!compatibility.compatible) {
        const nodeDerivedAtlas = buildNodeDerivedAtlasSource(nodeOrder)
        if (nodeDerivedAtlas) {
          dispatch(setUploadedAtlas(nodeDerivedAtlas))
          dispatch(setAtlasLabels(buildAtlasState(normalizeNodeOrder(nodeOrder))))
        }
        await dispatch(syncDatasetDerivedState())
        return {
          ...result,
          compatibilityWarning: `${result.fileName} is not compatible with the loaded node set. ${compatibility.reason} Using the node-derived atlas instead.`,
        }
      }

      await dispatch(syncDatasetDerivedState())
      return result
    } catch (error) {
      return rejectWithValue(getUploadAtlasErrorMessage(error))
    }
  },
)
