import { createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '@/types/store'
import { selectDatasetData, syncDatasetDerivedState } from '@/store/slices/dataset'
import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlasUi'
import { buildMatrixDerivedAtlasSource } from '@/utils/atlas/matrixDerivedAtlas'
import { checkAtlasMatrixCompatibility } from '@/utils/atlasCompatibility'
import { normalizeMatrixOrder } from '@/utils/matrixOrder'
import {
  getDatasetAtlasId,
  getDatasetMatrixOrder,
} from '@/utils/datasetAccessors'
import { clearUploadedAtlas, setUploadedAtlas } from './atlasDefinitionSlice'
import {
  loadDefaultAtlasDefinition,
  uploadAtlasDefinitionFromFile,
  type UploadAtlasError,
  type UploadAtlasPayload,
} from './atlasDefinitionThunks'

const getUploadAtlasErrorMessage = (error: unknown) => {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (
    error &&
    typeof error === 'object' &&
    'error' in error &&
    typeof (error as UploadAtlasError).error === 'string'
  ) {
    return (error as UploadAtlasError).error
  }
  return 'Failed to upload atlas.'
}

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
  { file: File },
  { state: RootState; rejectValue: string }
>(
  'atlasDefinition/uploadAtlasDefinitionAndSync',
  async ({ file }, { dispatch, getState, rejectWithValue }) => {
    try {
      const result = await dispatch(
        uploadAtlasDefinitionFromFile({ file }),
      ).unwrap()

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

export const clearUploadedAtlasAndSync = createAsyncThunk<
  void,
  void,
  { state: RootState }
>('atlasDefinition/clearUploadedAtlasAndSync', async (_, { dispatch, getState }) => {
  dispatch(clearUploadedAtlas())

  const state = getState()
  const atlasId = getDatasetAtlasId(selectDatasetData(state))
  const status = atlasId
    ? (state.atlasDefinition.defaultStatusById[atlasId] ?? 'idle')
    : 'idle'

  if (atlasId && status === 'idle') {
    await dispatch(loadDefaultAtlasDefinition({ atlasId }))
  }
  await dispatch(syncDatasetDerivedState())
})
