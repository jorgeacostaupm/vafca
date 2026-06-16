import { createAsyncThunk } from '@reduxjs/toolkit'

import { selectDatasetData } from '@/store/slices/dataset'
import type { RootState } from '@/types/store'
import { getDatasetNetworkByCompoundId } from '@/utils/datasetAccessors'

import { setNetworkViewStatus } from '../networkVisualizationSlice'
import type { NetworkViewFormattingError } from '../networkVisualizationTypes'

export const markNetworkViewFormatting = createAsyncThunk<
  { viewId: string },
  { viewId: string },
  { state: RootState; rejectValue: NetworkViewFormattingError }
>(
  'networkVisualization/markNetworkViewFormatting',
  async ({ viewId }, { dispatch, getState, rejectWithValue }) => {
    dispatch(setNetworkViewStatus({ viewId, status: 'formatting' }))

    const target = getState().networkVisualization.viewsById[viewId]
    if (!target) {
      const payload = { viewId, error: 'View not found.' }
      dispatch(setNetworkViewStatus({ ...payload, status: 'error' }))
      return rejectWithValue(payload)
    }

    const matrix = getDatasetNetworkByCompoundId(
      selectDatasetData(getState()),
      target.compoundId,
    )
    if (!matrix) {
      const payload = { viewId, error: 'Matrix not found in store.' }
      dispatch(setNetworkViewStatus({ ...payload, status: 'error' }))
      return rejectWithValue(payload)
    }

    dispatch(setNetworkViewStatus({ viewId, status: 'ready' }))
    return { viewId }
  },
)
