import type { PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit'

import { DEFAULT_NETWORK_NEXT_VIEW_SEQ } from '@/config/ui'
import type { NetworkViewType } from '@/types/networkVisualization'

import type {
  NetworkVisualizationState,
  SetNetworkViewStatusPayload,
} from '../networkVisualizationTypes'
import { getSharedSettings } from './networkVisualizationReducerUtils'

export const networkViewReducers = {
  setNetworkViewStatus(
    state,
    action: PayloadAction<SetNetworkViewStatusPayload>,
  ) {
    const { viewId, status, error } = action.payload
    const target = state.viewsById[viewId]
    if (!target) return
    target.status = status
    target.error = error
  },
  addNetworkView(
    state,
    action: PayloadAction<{
      type: NetworkViewType
      compoundId: string
      label: string
      measureId: string
      statId: string
    }>,
  ) {
    const seq = state.nextViewSeq
    state.nextViewSeq += 1
    const id = `${action.payload.compoundId}::${seq}`
    state.viewsOrder.unshift(id)
    state.viewsById[id] = {
      id,
      type: action.payload.type,
      compoundId: action.payload.compoundId,
      label: action.payload.label,
      measureId: action.payload.measureId,
      statId: action.payload.statId,
      status: 'formatting',
    }

    if (action.payload.type === 'matrix') {
      state.matrixSettingsByViewId[id] = {
        hideIsolatedNodes: state.controls.hideIsolatedNodes,
      }
    } else {
      state.nodeLinkSettingsByViewId[id] = {
        hideIsolatedNodes: state.controls.hideIsolatedNodes,
        circularLinkTension:
          action.payload.type === 'circular'
            ? state.controls.circularLinkTension
            : undefined,
        circularBundlingEnabled:
          action.payload.type === 'circular'
            ? state.controls.circularBundlingEnabled
            : undefined,
        circularPositiveLinkColor:
          action.payload.type === 'circular'
            ? state.controls.circularPositiveLinkColor
            : undefined,
        circularNegativeLinkColor:
          action.payload.type === 'circular'
            ? state.controls.circularNegativeLinkColor
            : undefined,
      }
    }
  },
  removeNetworkView(state, action: PayloadAction<{ viewId: string }>) {
    const { viewId } = action.payload
    delete state.viewsById[viewId]
    state.viewsOrder = state.viewsOrder.filter((id) => id !== viewId)
    delete state.matrixSettingsByViewId[viewId]
    delete state.nodeLinkSettingsByViewId[viewId]
  },
  clearNetworkViews(state) {
    state.viewsOrder = []
    state.viewsById = {}
    state.matrixSettingsByViewId = {}
    state.nodeLinkSettingsByViewId = {}
    state.nextViewSeq = DEFAULT_NETWORK_NEXT_VIEW_SEQ
  },
  mutateNetworkViewTypeLocally(
    state,
    action: PayloadAction<{ viewId: string; nextType: NetworkViewType }>,
  ) {
    const { viewId, nextType } = action.payload
    const target = state.viewsById[viewId]
    if (!target) return
    if (target.type === nextType) return

    const currentIsMatrix = target.type === 'matrix'
    const nextIsMatrix = nextType === 'matrix'

    if (currentIsMatrix && !nextIsMatrix) {
      const shared = getSharedSettings(state.matrixSettingsByViewId[viewId])
      delete state.matrixSettingsByViewId[viewId]
      state.nodeLinkSettingsByViewId[viewId] = {
        ...state.nodeLinkSettingsByViewId[viewId],
        ...shared,
      }
    } else if (!currentIsMatrix && nextIsMatrix) {
      const shared = getSharedSettings(state.nodeLinkSettingsByViewId[viewId])
      delete state.nodeLinkSettingsByViewId[viewId]
      state.matrixSettingsByViewId[viewId] = {
        ...state.matrixSettingsByViewId[viewId],
        ...shared,
      }
    }

    target.type = nextType
    target.error = undefined
  },
} satisfies SliceCaseReducers<NetworkVisualizationState>
