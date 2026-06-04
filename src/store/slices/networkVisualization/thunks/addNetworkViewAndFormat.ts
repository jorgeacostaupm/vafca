import { createAsyncThunk } from '@reduxjs/toolkit'

import { DEFAULT_NETWORK_PANEL_LAYOUT } from '@/config/ui'
import { addNetworkLayoutItem } from '@/store/slices/networkLayout'
import type { NetworkViewType } from '@/types/networkVisualization'
import type { AppDispatch, RootState } from '@/types/store'

import { addNetworkView } from '../networkVisualizationSlice'
import { markNetworkViewFormatting } from './markNetworkViewFormatting'

export const addNetworkViewAndFormat = createAsyncThunk<
  { viewId: string },
  {
    type: NetworkViewType
    compoundId: string
    label: string
    measureId: string
    statId: string
  },
  { state: RootState; dispatch: AppDispatch }
>(
  'networkVisualization/addNetworkViewAndFormat',
  async ({ type, compoundId, label, measureId, statId }, { dispatch, getState }) => {
    const viewId = `${compoundId}::${getState().networkVisualization.nextViewSeq}`
    dispatch(
      addNetworkView({
        type,
        compoundId,
        label,
        measureId,
        statId,
      }),
    )
    dispatch(
      addNetworkLayoutItem({
        viewId,
        defaultW: DEFAULT_NETWORK_PANEL_LAYOUT.width,
        defaultH: DEFAULT_NETWORK_PANEL_LAYOUT.height,
        initialX: DEFAULT_NETWORK_PANEL_LAYOUT.initialX,
        initialY: DEFAULT_NETWORK_PANEL_LAYOUT.initialY,
      }),
    )
    await dispatch(markNetworkViewFormatting({ viewId }))
    return { viewId }
  },
)
