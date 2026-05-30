import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AtlasDefinition } from '@/types/atlas'
import type { InitialDataConfig } from '@/config/initialData'
import type { MatrixOrderEntry } from '@/types/matrixOrder'
import type { RootState } from '@/types/store'
import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlasUi'
import {
  clearUploadedAtlas,
  loadDefaultAtlasDefinition,
  setUploadedAtlas,
} from '@/store/slices/atlasDefinition'
import { buildMatrixDerivedAtlasSource } from '@/utils/atlas/matrixDerivedAtlas'
import { normalizeMatrixOrder } from '@/utils/matrixOrder'
import {
  getDatasetAtlasId,
  getDatasetMatrixOrder,
} from '@/utils/datasetAccessors'
import { loadInitialDataset } from './datasetThunks'
import { clearDataset } from './datasetSlice'
import { selectDatasetData } from './datasetSelectors'

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
      name: roi.name ?? entry.name ?? entry.label,
      label: roi.name ?? entry.label,
      acronym: roi.label ?? entry.label,
      tags: roi.tags,
      metadata: roi.metadata,
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
    name: roi.name ?? roi.label ?? String(roi.id),
    acronym: roi.label ?? roi.name ?? String(roi.id),
    tags: roi.tags,
    metadata: roi.metadata,
  }))

const getInitialDataFileName = (path: string, fallback: string) =>
  path.split('/').pop() ?? fallback

export const syncDatasetDerivedState = createAsyncThunk<
  void,
  void,
  { state: RootState }
>('dataset/syncDatasetDerivedState', async (_, { dispatch, getState }) => {
  const state = getState()
  const data = selectDatasetData(state)
  if (!data) return

  const matrixOrder = normalizeMatrixOrder(getDatasetMatrixOrder(data))
  if (matrixOrder.length === 0) return

  const atlasId = getDatasetAtlasId(data)
  const atlasDefinition = resolveAtlasDefinition(state, atlasId)
  const atlasOrder = buildAtlasOrder(matrixOrder, atlasDefinition)
  dispatch(setAtlasLabels(buildAtlasState(atlasOrder, state.atlasUi)))
})

export const initializeDatasetAndDerivedState = createAsyncThunk<
  void,
  InitialDataConfig,
  { state: RootState }
>(
  'dataset/initializeDatasetAndDerivedState',
  async (config, { dispatch, getState }) => {
    if (config.loadInitialDataset) {
      await dispatch(loadInitialDataset({ path: config.initialDatasetFile.path }))
    } else {
      dispatch(clearDataset())
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
    const data = selectDatasetData(state)

    if (data) {
      if (!config.loadTestAtlas) {
        const atlasSource = buildMatrixDerivedAtlasSource(getDatasetMatrixOrder(data))
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
