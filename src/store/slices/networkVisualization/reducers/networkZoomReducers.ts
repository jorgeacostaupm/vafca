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
    action: PayloadAction<{
      viewId: string
      label: string
      orderedLabels?: string[]
    }>,
  ) {
    const { viewId, label, orderedLabels } = action.payload
    const descriptor = state.viewsById[viewId]
    if (!descriptor) return

    const settings = ensureSettingsEntry(state, viewId, descriptor.type)
    const current = settings.zoomLabelSelection ?? []
    const exists = current.includes(label)
    const nextRaw = exists
      ? current.filter((item) => item !== label)
      : [...current, label]

    settings.zoomLabelSelection =
      orderedLabels && nextRaw.length > 1
        ? orderedLabels.filter((item) => nextRaw.includes(item))
        : nextRaw
  },
  resetNetworkZoomLabelSelection(
    state,
    action: PayloadAction<{ viewId: string }>,
  ) {
    const { viewId } = action.payload
    const descriptor = state.viewsById[viewId]
    if (!descriptor) return

    const settings = ensureSettingsEntry(state, viewId, descriptor.type)
    settings.zoomLabelSelection = []
  },
} satisfies SliceCaseReducers<NetworkVisualizationState>
