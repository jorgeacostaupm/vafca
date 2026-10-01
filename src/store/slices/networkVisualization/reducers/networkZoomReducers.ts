import type { PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit'

import type { ZoomSelection } from '@/types/networkVisualization'

import type { NetworkVisualizationState } from '../networkVisualizationTypes'
import {
  ensureSettingsEntry,
  stepZoomSelection,
  updateZoomSelection,
} from './networkVisualizationReducerUtils'

export const networkZoomReducers = {
  applyNetworkZoom(
    state,
    action: PayloadAction<{ targetViewIds: string[]; selection: ZoomSelection }>,
  ) {
    const { targetViewIds, selection } = action.payload
    targetViewIds.forEach((viewId) => {
      const descriptor = state.viewsById[viewId]
      if (!descriptor) return
      const settings = ensureSettingsEntry(state, viewId, descriptor.type)
      updateZoomSelection(settings, selection)
    })
  },
  stepNetworkZoomHistory(
    state,
    action: PayloadAction<{ targetViewIds: string[]; delta: -1 | 1 }>,
  ) {
    const { targetViewIds, delta } = action.payload
    targetViewIds.forEach((viewId) => {
      const descriptor = state.viewsById[viewId]
      if (!descriptor) return
      const settings = ensureSettingsEntry(state, viewId, descriptor.type)
      stepZoomSelection(settings, delta)
    })
  },
  toggleNetworkZoomLabelSelection(
    state,
    action: PayloadAction<{ viewId?: string; label: string; orderedLabels?: string[] }>,
  ) {
    const { label } = action.payload
    // Node selection belongs to the dataset, including when no network view is open.
    state.selectedNodeIds = state.selectedNodeIds.includes(label)
      ? state.selectedNodeIds.filter(id => id !== label)
      : [...state.selectedNodeIds, label]
  },
  resetNetworkZoomLabelSelection(state) {
    state.selectedNodeIds = []
  },
} satisfies SliceCaseReducers<NetworkVisualizationState>
