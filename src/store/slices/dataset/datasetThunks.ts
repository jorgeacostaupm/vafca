import { createAsyncThunk } from '@reduxjs/toolkit'
import type { ConnectivityDataset } from '@/types/datasets'
import type { DatasetMeta, MatrixUploadResult } from '@/types/datasetState'
import type { MatrixOrderItem } from '@/types/matrixOrder'
import type { RootState } from '@/types/store'
import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlas'
import { setUploadedAtlas } from '@/store/slices/atlasDefinition'
import { buildMatrixDerivedAtlasSource } from '@/utils/atlas/matrixDerivedAtlas'
import { checkAtlasMatrixCompatibility } from '@/utils/atlasCompatibility'
import { getAllMatrices, saveMatrices, upsertMatrices } from '@/utils/matrixStore'
import { buildMatrixStats } from '@/utils/matrixStats'
import { validateMatrixPayload } from '@/utils/matrixValidation'
import {
  acceptMatricesForMatrixDerivedAtlas,
  resolveResetMatrixOrder,
} from '@/utils/matrixUploadAtlasReset'
import { normalizeMatrixOrder } from '@/utils/matrixOrder'

const withoutAtlasMetadata = (
  metadata: ConnectivityDataset['metadata'],
): ConnectivityDataset['metadata'] => {
  const metadataWithoutAtlas = { ...metadata }
  delete metadataWithoutAtlas.atlas
  delete metadataWithoutAtlas.atlasId
  return metadataWithoutAtlas
}

export const loadTestDataset = createAsyncThunk<DatasetMeta>(
  'dataset/loadTestDataset',
  async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/testData.json`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const dataset = (await response.json()) as ConnectivityDataset
    await saveMatrices(dataset.matrices)

    return {
      metadata: withoutAtlasMetadata(dataset.metadata),
      catalogs: dataset.catalogs,
      matrixStats: buildMatrixStats(dataset.matrices),
    }
  },
)

export const downloadCurrentDataset = createAsyncThunk<
  { fileName: string },
  void,
  { state: RootState; rejectValue: string }
>('dataset/downloadCurrentDataset', async (_, { getState, rejectWithValue }) => {
  const data = getState().dataset.data
  if (!data) {
    return rejectWithValue('No dataset loaded yet.')
  }

  try {
    const matrices = await getAllMatrices()
    const payload = {
      metadata: data.metadata,
      catalogs: data.catalogs,
      matrices,
    }
    const datePart = new Date().toISOString().slice(0, 10)
    const fileName = `dataset-${datePart}.json`
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
    return { fileName }
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to export dataset.',
    )
  }
})

export const uploadMatricesIntoDataset = createAsyncThunk<
  MatrixUploadResult & {
    matrixStats: DatasetMeta['matrixStats']
    matrixOrder?: MatrixOrderItem[] | null
    atlasCompatibilityWarning?: string
  },
  { files: File[]; resetAtlas?: boolean },
  { state: RootState; rejectValue: string }
>(
  'dataset/uploadMatricesIntoDataset',
  async ({ files, resetAtlas = false }, { dispatch, getState, rejectWithValue }) => {
    const data = getState().dataset.data
    if (!data) {
      return rejectWithValue('No dataset loaded yet.')
    }

    const errors: MatrixUploadResult['errors'] = []
    const validMatrices: ConnectivityDataset['matrices'] = []
    let generatedMatrixOrder: MatrixOrderItem[] | null = null

    for (const file of files) {
      try {
        const payload = JSON.parse(await file.text()) as unknown
        const resetMatrixOrder: {
          inferredMatrixOrder: MatrixOrderItem[] | null
          validationMatrixOrder: MatrixOrderItem[]
        } | null = resetAtlas
          ? resolveResetMatrixOrder({
              source: file.name,
              payload,
              inferredMatrixOrder: generatedMatrixOrder,
              errors,
            })
          : null
        generatedMatrixOrder =
          resetMatrixOrder?.inferredMatrixOrder ?? generatedMatrixOrder

        const result = validateMatrixPayload(
          payload,
          file.name,
          data.catalogs,
          {
            ...data.metadata,
            matrixOrder:
              resetMatrixOrder?.validationMatrixOrder ?? data.metadata.matrixOrder,
          },
        )
        if (resetAtlas) {
          const accepted = acceptMatricesForMatrixDerivedAtlas({
            source: file.name,
            matrices: result.validMatrices,
            inferredMatrixOrder: generatedMatrixOrder,
            errors,
          })
          generatedMatrixOrder = accepted.inferredMatrixOrder
          validMatrices.push(...accepted.acceptedMatrices)
        } else {
          validMatrices.push(...result.validMatrices)
        }
        errors.push(...result.errors)
      } catch (error) {
        errors.push({
          source: file.name,
          message:
            error instanceof Error ? error.message : 'The file is not valid JSON.',
        })
      }
    }

    if (validMatrices.length === 0) {
      return rejectWithValue(
        errors.length > 0
          ? 'No valid matrices were found in the uploaded files.'
          : 'No matrices were found in the uploaded files.',
      )
    }

    await upsertMatrices(validMatrices)
    const matrices = await getAllMatrices()
    let atlasCompatibilityWarning: string | undefined

    if (resetAtlas && generatedMatrixOrder) {
      const atlasSource = buildMatrixDerivedAtlasSource(generatedMatrixOrder)
      if (atlasSource) {
        dispatch(setUploadedAtlas(atlasSource))
        dispatch(
          setAtlasLabels(
            buildAtlasState(normalizeMatrixOrder(generatedMatrixOrder)),
          ),
        )
      }
    } else {
      const uploadedAtlas = getState().atlasDefinition.uploaded
      const compatibility = checkAtlasMatrixCompatibility(
        data.metadata.matrixOrder,
        uploadedAtlas?.atlas,
      )
      if (!compatibility.compatible) {
        const atlasSource = buildMatrixDerivedAtlasSource(data.metadata.matrixOrder)
        if (atlasSource) {
          dispatch(setUploadedAtlas(atlasSource))
          dispatch(
            setAtlasLabels(
              buildAtlasState(normalizeMatrixOrder(data.metadata.matrixOrder)),
            ),
          )
          atlasCompatibilityWarning = `${uploadedAtlas?.fileName ?? 'The active atlas'} is not compatible with the loaded matrices. ${compatibility.reason} Using the matrix-derived atlas instead.`
        }
      }
    }

    return {
      files: files.length,
      validMatrices: validMatrices.length,
      invalidMatrices: errors.length,
      errors,
      matrixStats: buildMatrixStats(matrices),
      matrixOrder: resetAtlas ? generatedMatrixOrder : undefined,
      atlasCompatibilityWarning,
    }
  },
)
