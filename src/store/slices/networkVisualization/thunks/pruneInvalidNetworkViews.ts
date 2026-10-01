import { createAsyncThunk } from '@reduxjs/toolkit'

import { removeNetworkLayoutItem } from '@/store/slices/networkLayout'
import type { RootState } from '@/types/store'

import { removeNetworkView } from '../networkVisualizationSlice'

export const pruneInvalidNetworkViews = createAsyncThunk<
  void,
  { validCompoundIds: string[]; enabled: boolean },
  { state: RootState }
>(
  'networkVisualization/pruneInvalidNetworkViews',
  async ({ validCompoundIds, enabled }, { dispatch, getState }) => {
    if (!enabled) return

    const validIds = new Set(validCompoundIds)
    const { viewsOrder, viewsById } = getState().networkVisualization
    viewsOrder.forEach((viewId) => {
      const view = viewsById[viewId]
      if (!view) return
      if (view.temporaryNetworkId) return
      if (validIds.has(view.compoundId)) return
      dispatch(removeNetworkView({ viewId: view.id }))
      dispatch(removeNetworkLayoutItem({ viewId: view.id }))
    })
  },
)
