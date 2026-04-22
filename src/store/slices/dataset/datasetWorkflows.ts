import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AtlasDefinition } from '@/types/atlas'
import type { MatrixShape } from '@/types/matrix'
import type { MatrixOrderEntry } from '@/types/matrixOrder'
import type { RootState } from '@/types/store'
import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlas'
import { loadDefaultAtlasDefinition } from '@/store/slices/atlasDefinition'
import { setMatrixShape } from '@/store/slices/visualizationUi'
import { normalizeMatrixOrder } from '@/utils/matrixOrder'
import { loadTestDataset } from './datasetThunks'
import { updateMetadata } from './datasetSlice'

const buildAtlasOrder = (
  matrixOrder: MatrixOrderEntry[],
  atlasDefinition: AtlasDefinition | null,
) => {
  if (matrixOrder.length === 0) return []
  if (!atlasDefinition?.rois?.length) return matrixOrder

  const roiById = new Map(atlasDefinition.rois.map((roi) => [String(roi.id), roi]))
  return matrixOrder.map((entry) => {
    const roi = roiById.get(entry.id)
    if (!roi) return entry
    return {
      ...entry,
      label: roi.name ?? entry.label,
      acronym: roi.label ?? entry.label,
    }
  })
}

const resolveAtlasDefinition = (state: RootState, atlasId?: string) => {
  if (state.atlasDefinition.uploaded?.atlas) {
    return state.atlasDefinition.uploaded.atlas
  }
  if (!atlasId) return null
  return state.atlasDefinition.defaultById[atlasId] ?? null
}

export const syncDatasetDerivedState = createAsyncThunk<
  void,
  void,
  { state: RootState }
>('dataset/syncDatasetDerivedState', async (_, { dispatch, getState }) => {
  const state = getState()
  const data = state.dataset.data
  if (!data) return

  const shape = data.metadata.matrixShape
  if (shape) {
    dispatch(setMatrixShape(shape))
  }

  const matrixOrder = normalizeMatrixOrder(data.metadata.matrixOrder)
  if (matrixOrder.length === 0) return

  const atlasId = data.metadata.atlasId ?? data.metadata.atlas
  const atlasDefinition = resolveAtlasDefinition(state, atlasId)
  const atlasOrder = buildAtlasOrder(matrixOrder, atlasDefinition)
  dispatch(setAtlasLabels(buildAtlasState(atlasOrder, state.atlas)))
})

export const initializeDatasetAndDerivedState = createAsyncThunk<
  void,
  void,
  { state: RootState }
>('dataset/initializeDatasetAndDerivedState', async (_, { dispatch, getState }) => {
  await dispatch(loadTestDataset())

  const state = getState()
  const data = state.dataset.data
  if (!data) return

  const atlasId = data.metadata.atlasId ?? data.metadata.atlas
  const hasUploadedAtlas = Boolean(state.atlasDefinition.uploaded?.atlas)
  const atlasStatus = atlasId
    ? (state.atlasDefinition.defaultStatusById[atlasId] ?? 'idle')
    : 'idle'

  if (!hasUploadedAtlas && atlasId && atlasStatus === 'idle') {
    await dispatch(loadDefaultAtlasDefinition({ atlasId }))
  }

  await dispatch(syncDatasetDerivedState())
})

export const setDatasetMatrixShape = createAsyncThunk<
  void,
  { shape: MatrixShape }
>('dataset/setDatasetMatrixShape', async ({ shape }, { dispatch }) => {
  dispatch(updateMetadata({ changes: { matrixShape: shape } }))
  dispatch(setMatrixShape(shape))
})
