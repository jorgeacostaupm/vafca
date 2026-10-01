import type { PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit'

import type { StatRangeValue } from '@/types/matrixView'
import type {
  MatrixNetworkViewSettings,
  NodeLinkNetworkViewSettings,
} from '@/types/networkVisualization'

import type { NetworkVisualizationState } from '../networkVisualizationTypes'
import {
  clearFilterSourceFromOtherViews,
  ensureSettingsEntry,
  setStatRange,
} from './networkVisualizationReducerUtils'

export const networkSettingsReducers = {
  patchNetworkMatrixSettings(
    state,
    action: PayloadAction<{
      viewId: string
      patch: Partial<MatrixNetworkViewSettings>
    }>,
  ) {
    const { viewId, patch } = action.payload
    state.matrixSettingsByViewId[viewId] = {
      ...state.matrixSettingsByViewId[viewId],
      ...patch,
    }
    if (patch.useAsNodeFilter || patch.useAsLinkFilter) {
      clearFilterSourceFromOtherViews(state, viewId)
    }
  },
  patchNetworkNodeLinkSettings(
    state,
    action: PayloadAction<{
      viewId: string
      patch: Partial<NodeLinkNetworkViewSettings>
    }>,
  ) {
    const { viewId, patch } = action.payload
    state.nodeLinkSettingsByViewId[viewId] = {
      ...state.nodeLinkSettingsByViewId[viewId],
      ...patch,
    }
    if (patch.useAsNodeFilter || patch.useAsLinkFilter) {
      clearFilterSourceFromOtherViews(state, viewId)
    }
  },
  resetNetworkViewSettings(state, action: PayloadAction<{ viewId: string }>) {
    const { viewId } = action.payload
    delete state.matrixSettingsByViewId[viewId]
    delete state.nodeLinkSettingsByViewId[viewId]
  },
  updateNetworkViewStatRange(
    state,
    action: PayloadAction<{
      viewId: string
      value: [number, number]
      segment?: 'negative' | 'positive'
      fallback?: StatRangeValue
      enabled?: boolean
    }>,
  ) {
    const { viewId, value, segment, fallback, enabled } = action.payload
    const target = state.viewsById[viewId]
    if (!target) return

    const settings = ensureSettingsEntry(state, viewId, target.type)
    setStatRange(settings, value, segment, fallback, enabled)
  },
} satisfies SliceCaseReducers<NetworkVisualizationState>
