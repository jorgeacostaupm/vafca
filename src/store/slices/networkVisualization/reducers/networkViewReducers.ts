import type { PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit'

import { DEFAULT_NETWORK_NEXT_VIEW_SEQ } from '@/config/ui'
import type { NetworkViewType } from '@/types/networkVisualization'
import { buildAggregatedGroupLabels } from '@/utils/aggregatedNodePresentation'

import type {
  NetworkVisualizationState,
  SetNetworkViewStatusPayload,
} from '../networkVisualizationTypes'
import { ensureSettingsEntry, getSharedSettings } from './networkVisualizationReducerUtils'

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
  addTemporaryAggregatedNetworkView(
    state,
    action: PayloadAction<{
      viewId: string
      temporaryNetworkId: string
      type: NetworkViewType
      label: string
      measureId: string
      statisticId: string
      loadingMessage: string
    }>,
  ) {
    state.nextViewSeq += 1
    state.viewsOrder.unshift(action.payload.viewId)
    state.viewsById[action.payload.viewId] = {
      id: action.payload.viewId,
      type: action.payload.type,
      compoundId: action.payload.temporaryNetworkId,
      temporaryNetworkId: action.payload.temporaryNetworkId,
      coordinationDisabled: true,
      label: action.payload.label,
      measureId: action.payload.measureId,
      statisticId: action.payload.statisticId,
      status: 'formatting',
      loadingMessage: action.payload.loadingMessage,
    }

    if (action.payload.type === 'matrix') {
      state.matrixSettingsByViewId[action.payload.viewId] = {
        hideIsolatedNodes: state.controls.hideIsolatedNodes,
      }
    } else {
      state.nodeLinkSettingsByViewId[action.payload.viewId] = {
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
  setTemporaryAggregatedNetwork(
    state,
    action: PayloadAction<{
      viewId: string
      network: NetworkVisualizationState['temporaryNetworksById'][string]
    }>,
  ) {
    const target = state.viewsById[action.payload.viewId]
    if (!target) return
    state.temporaryNetworksById[action.payload.network.id] = action.payload.network
    target.temporaryNetworkId = action.payload.network.id
    target.compoundId = action.payload.network.id
    target.label = action.payload.network.label
    target.status = 'ready'
    target.loadingMessage = undefined
    target.error = undefined
  },
  renameAggregatedGroups(
    state,
    action: PayloadAction<{ viewId: string; labels: Record<string, string> }>,
  ) {
    const id = state.viewsById[action.payload.viewId]?.temporaryNetworkId
    const network = id ? state.temporaryNetworksById[id] : undefined
    if (!network || Object.values(action.payload.labels).some(label => typeof label !== 'string')) return
    Object.assign(network, buildAggregatedGroupLabels(network.groups, action.payload.labels))
  },
  addNetworkView(
    state,
    action: PayloadAction<{
      type: NetworkViewType
      compoundId: string
      label: string
      measureId: string
      statisticId: string
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
      statisticId: action.payload.statisticId,
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

    if (state.controls.syncZoom) {
      const isMatrix = action.payload.type === 'matrix'
      const sourceId = state.viewsOrder.find((viewId) => {
        const view = state.viewsById[viewId]
        return viewId !== id && view && !view.coordinationDisabled &&
          (view.type === 'matrix') === isMatrix
      })
      const source = sourceId
        ? (isMatrix ? state.matrixSettingsByViewId[sourceId] : state.nodeLinkSettingsByViewId[sourceId])
        : undefined
      if (source) {
        const settings = ensureSettingsEntry(state, id, action.payload.type)
        settings.zoomHistory = source.zoomHistory?.slice()
        settings.zoomIndex = source.zoomIndex
      }
    }
  },
  removeNetworkView(state, action: PayloadAction<{ viewId: string }>) {
    const { viewId } = action.payload
    const temporaryNetworkId = state.viewsById[viewId]?.temporaryNetworkId
    delete state.viewsById[viewId]
    state.viewsOrder = state.viewsOrder.filter((id) => id !== viewId)
    delete state.matrixSettingsByViewId[viewId]
    delete state.nodeLinkSettingsByViewId[viewId]
    if (temporaryNetworkId) delete state.temporaryNetworksById[temporaryNetworkId]
  },
  clearNetworkViews(state) {
    state.viewsOrder = []
    state.viewsById = {}
    state.temporaryNetworksById = {}
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
