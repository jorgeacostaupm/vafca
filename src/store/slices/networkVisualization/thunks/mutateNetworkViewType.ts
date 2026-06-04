import { createAsyncThunk } from '@reduxjs/toolkit'

import type { NetworkViewType } from '@/types/networkVisualization'
import type { AppDispatch, RootState } from '@/types/store'

import { mutateNetworkViewTypeLocally } from '../networkVisualizationSlice'
import { markNetworkViewFormatting } from './markNetworkViewFormatting'

export const mutateNetworkViewType = createAsyncThunk<
  void,
  { viewId: string; nextType: NetworkViewType },
  { state: RootState; dispatch: AppDispatch }
>(
  'networkVisualization/mutateNetworkViewType',
  async ({ viewId, nextType }, { dispatch, getState }) => {
    const target = getState().networkVisualization.viewsById[viewId]
    if (!target) return
    if (target.type === nextType) return

    dispatch(mutateNetworkViewTypeLocally({ viewId, nextType }))
    await dispatch(markNetworkViewFormatting({ viewId }))
  },
)
