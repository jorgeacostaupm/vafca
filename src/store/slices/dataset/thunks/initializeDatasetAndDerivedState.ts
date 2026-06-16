import { createAsyncThunk } from '@reduxjs/toolkit'

import type { InitialDataConfig } from '@/config/initialData'
import {
  clearUploadedAtlas,
  loadDefaultAtlasDefinition,
  setUploadedAtlas,
} from '@/store/slices/atlasDefinition'
import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlasUi'
import type { AtlasDefinition } from '@/types/atlas'
import type { RootState } from '@/types/store'
import { buildNodeDerivedAtlasSource } from '@/utils/atlas/nodeDerivedAtlas'
import { getDatasetNodeOrder } from '@/utils/datasetAccessors'

import { selectDatasetData } from '../datasetSelectors'
import { clearDataset } from '../datasetSlice'
import {
  buildAtlasOrderFromDefinition,
  getInitialDataFileName,
} from '../utils/atlasDerivedState'
import { loadInitialDataset } from './loadInitialDataset'
import { syncDatasetDerivedState } from './syncDatasetDerivedState'

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
              fileName: getInitialDataFileName(config.testAtlasFile),
            }),
          )
        }
      } catch {
        loadedTestAtlas = null
      }
    } else {
      dispatch(clearUploadedAtlas())
    }

    const data = selectDatasetData(getState())

    if (data) {
      if (!config.loadTestAtlas) {
        const atlasSource = buildNodeDerivedAtlasSource(getDatasetNodeOrder(data))
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
