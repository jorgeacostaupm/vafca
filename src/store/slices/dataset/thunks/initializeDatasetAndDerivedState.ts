import { createAsyncThunk } from '@reduxjs/toolkit'

import type { InitialDataConfig } from '@/config/initialData'
import {
  clearUploadedAtlas,
} from '@/store/slices/atlasDefinition'
import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlasUi'
import type { RootState } from '@/types/store'

import { selectDatasetData } from '../datasetSelectors'
import { clearDataset } from '../datasetSlice'
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
      await dispatch(loadInitialDataset({ path: config.initialDatasetFile.path })).unwrap()
    } else {
      dispatch(clearDataset())
    }

    if (!config.loadInitialDataset) dispatch(clearUploadedAtlas())

    const data = selectDatasetData(getState())

    if (data) {
      await dispatch(syncDatasetDerivedState())
      return
    }

    dispatch(setAtlasLabels(buildAtlasState([])))
  },
  { condition: (_, { getState }) => getState().datasetOperations.status !== 'loading' },
)
