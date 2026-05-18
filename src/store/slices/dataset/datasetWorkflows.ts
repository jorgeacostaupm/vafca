import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AtlasDefinition } from '@/types/atlas'
import type { InitialDataConfig } from '@/config/initialData'
import type { MatrixOrderEntry } from '@/types/matrixOrder'
import type { RootState } from '@/types/store'
import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlas'
import {
  clearUploadedAtlas,
  loadDefaultAtlasDefinition,
  setUploadedAtlas,
} from '@/store/slices/atlasDefinition'
import { buildMatrixDerivedAtlasSource } from '@/utils/atlas/matrixDerivedAtlas'
import { clearMatrices } from '@/utils/matrixStore'
import { normalizeMatrixOrder } from '@/utils/matrixOrder'
import { loadTestDataset } from './datasetThunks'
import { clearDataset } from './datasetSlice'

const buildAtlasOrder = (
  matrixOrder: MatrixOrderEntry[],
  atlasDefinition: AtlasDefinition | null,
) => {
  if (matrixOrder.length === 0) return []
  if (!atlasDefinition?.rois?.length) return matrixOrder

  const roiById = new Map(
    atlasDefinition.rois.flatMap((roi) => [
      [String(roi.id), roi] as const,
      [String(roi.atlasId), roi] as const,
    ]),
  )
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

const buildAtlasOrderFromDefinition = (
  atlasDefinition: AtlasDefinition,
): MatrixOrderEntry[] =>
  atlasDefinition.rois.map((roi) => ({
    id: String(roi.id),
    label: roi.name ?? roi.label ?? String(roi.id),
    acronym: roi.label ?? roi.name ?? String(roi.id),
  }))

const getInitialDataFileName = (path: string, fallback: string) =>
  path.split('/').pop() ?? fallback

export const syncDatasetDerivedState = createAsyncThunk<
  void,
  void,
  { state: RootState }
>('dataset/syncDatasetDerivedState', async (_, { dispatch, getState }) => {
  const state = getState()
  const data = state.dataset.data
  if (!data) return

  const matrixOrder = normalizeMatrixOrder(data.metadata.matrixOrder)
  if (matrixOrder.length === 0) return

  const atlasId = data.metadata.atlasId ?? data.metadata.atlas
  const atlasDefinition = resolveAtlasDefinition(state, atlasId)
  const atlasOrder = buildAtlasOrder(matrixOrder, atlasDefinition)
  dispatch(setAtlasLabels(buildAtlasState(atlasOrder, state.atlas)))
})

export const initializeDatasetAndDerivedState = createAsyncThunk<
  void,
  InitialDataConfig,
  { state: RootState }
>(
  'dataset/initializeDatasetAndDerivedState',
  async (config, { dispatch, getState }) => {
    if (config.loadTestDataset) {
      await dispatch(loadTestDataset({ path: config.testDatasetFile.path }))
    } else {
      dispatch(clearDataset())
      await clearMatrices()
    }

    let loadedTestAtlas: AtlasDefinition | null = null
    if (config.loadTestAtlas) {
      try {
        const result = await dispatch(
          loadDefaultAtlasDefinition({ path: config.testAtlasFile.path }),
        ).unwrap()
        loadedTestAtlas = result.atlas
        if (loadedTestAtlas) {
          dispatch(
            setUploadedAtlas({
              atlas: loadedTestAtlas,
              fileName: getInitialDataFileName(
                config.testAtlasFile.path,
                config.testAtlasFile.label,
              ),
            }),
          )
        }
      } catch {
        loadedTestAtlas = null
      }
    } else {
      dispatch(clearUploadedAtlas())
    }

    const state = getState()
    const data = state.dataset.data

    if (data) {
      if (!config.loadTestAtlas) {
        const atlasSource = buildMatrixDerivedAtlasSource(data.metadata.matrixOrder)
        if (atlasSource) {
          dispatch(setUploadedAtlas(atlasSource))
        }
      }
      await dispatch(syncDatasetDerivedState())
      return
    }

    if (loadedTestAtlas) {
      dispatch(
        setAtlasLabels(buildAtlasState(buildAtlasOrderFromDefinition(loadedTestAtlas))),
      )
      return
    }

    dispatch(setAtlasLabels(buildAtlasState([])))
  },
)
