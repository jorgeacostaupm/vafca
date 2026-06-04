import { createAsyncThunk } from '@reduxjs/toolkit'

import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlasUi'
import { selectDatasetData, syncDatasetDerivedState } from '@/store/slices/dataset'
import type { RootState } from '@/types/store'
import { buildMatrixDerivedAtlasSource } from '@/utils/atlas/matrixDerivedAtlas'
import { checkAtlasMatrixCompatibility } from '@/utils/atlasCompatibility'
import { getDatasetMatrixOrder } from '@/utils/datasetAccessors'
import { normalizeMatrixOrder } from '@/utils/matrixOrder'

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

      const matrixOrder = getDatasetMatrixOrder(selectDatasetData(getState()))
      const compatibility = checkAtlasMatrixCompatibility(matrixOrder, result.atlas)
      if (!compatibility.compatible) {
        const matrixDerivedAtlas = buildMatrixDerivedAtlasSource(matrixOrder)
        if (matrixDerivedAtlas) {
          dispatch(setUploadedAtlas(matrixDerivedAtlas))
          dispatch(setAtlasLabels(buildAtlasState(normalizeMatrixOrder(matrixOrder))))
        }
        await dispatch(syncDatasetDerivedState())
        return {
          ...result,
          compatibilityWarning: `${result.fileName} is not compatible with the loaded matrices. ${compatibility.reason} Using the matrix-derived atlas instead.`,
        }
      }

      await dispatch(syncDatasetDerivedState())
      return result
    } catch (error) {
      return rejectWithValue(getUploadAtlasErrorMessage(error))
    }
  },
)
