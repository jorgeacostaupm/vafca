import type { PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit'

import type { CatalogMatrixPrunePayload } from '@/store/slices/dataset/utils/catalogMatrixPruning'
import type { NetworkSelectorControlsState } from '@/types/networkVisualization'

import {
  initialNetworkControls,
  type NetworkVisualizationState,
} from '../networkVisualizationTypes'

const populationKeyIncludes = (populationKey: string, populationId: string) =>
  populationKey.split('+').includes(populationId)

const clearDisabledCatalogFields = (
  controls: NetworkSelectorControlsState,
  payload: CatalogMatrixPrunePayload,
  invalidCompoundIds: Set<string>,
) => {
  if (payload.catalog === 'populations' && populationKeyIncludes(controls.populationKey, payload.id)) {
    controls.populationKey = ''
    controls.measureId = ''
    controls.statId = ''
    controls.layerId = ''
    controls.selectedCompoundId = ''
    return
  }

  if (payload.catalog === 'measures' && controls.measureId === payload.id) {
    controls.measureId = ''
    controls.statId = ''
    controls.layerId = ''
    controls.selectedCompoundId = ''
    return
  }

  if (payload.catalog === 'stats' && controls.statId === payload.id) {
    controls.statId = ''
    controls.layerId = ''
    controls.selectedCompoundId = ''
    return
  }

  if (payload.catalog === 'layers' && controls.layerId === payload.id) {
    controls.layerId = ''
    controls.selectedCompoundId = ''
    return
  }

  if (invalidCompoundIds.has(controls.selectedCompoundId)) {
    controls.selectedCompoundId = ''
  }
}

export const networkControlReducers = {
  patchNetworkControls(
    state,
    action: PayloadAction<Partial<NetworkSelectorControlsState>>,
  ) {
    const previousViewType = state.controls.viewType
    const nextViewType = action.payload.viewType ?? previousViewType
    state.controlsByViewType[previousViewType] = { ...state.controls }

    const baseControls =
      nextViewType !== previousViewType
        ? (state.controlsByViewType[nextViewType] ?? {
            ...initialNetworkControls,
            viewType: nextViewType,
          })
        : state.controls

    state.controls = {
      ...baseControls,
      ...action.payload,
      viewType: nextViewType,
    }
    state.controlsByViewType[nextViewType] = { ...state.controls }
  },
  resetNetworkControls(state) {
    state.controls = { ...initialNetworkControls }
    state.controlsByViewType = {
      [initialNetworkControls.viewType]: { ...initialNetworkControls },
    }
  },
  pruneNetworkSelectionForDisabledCatalogItem(
    state,
    action: PayloadAction<CatalogMatrixPrunePayload>,
  ) {
    const invalidCompoundIds = new Set(action.payload.invalidCompoundIds)
    clearDisabledCatalogFields(state.controls, action.payload, invalidCompoundIds)
    Object.values(state.controlsByViewType).forEach((controls) => {
      if (!controls) return
      clearDisabledCatalogFields(controls, action.payload, invalidCompoundIds)
    })

    state.viewsOrder = state.viewsOrder.filter((viewId) => {
      const view = state.viewsById[viewId]
      if (!view) return false
      if (invalidCompoundIds.has(view.compoundId)) {
        delete state.viewsById[viewId]
        delete state.matrixSettingsByViewId[viewId]
        delete state.nodeLinkSettingsByViewId[viewId]
        return false
      }
      if (action.payload.catalog === 'measures' && view.measureId === action.payload.id) {
        delete state.viewsById[viewId]
        delete state.matrixSettingsByViewId[viewId]
        delete state.nodeLinkSettingsByViewId[viewId]
        return false
      }
      if (action.payload.catalog === 'stats' && view.statId === action.payload.id) {
        delete state.viewsById[viewId]
        delete state.matrixSettingsByViewId[viewId]
        delete state.nodeLinkSettingsByViewId[viewId]
        return false
      }
      return true
    })
  },
  setNetworkHideIsolatedNodes(state, action: PayloadAction<{ value: boolean }>) {
    const { value } = action.payload
    state.controls.hideIsolatedNodes = value
    state.viewsOrder.forEach((viewId) => {
      const descriptor = state.viewsById[viewId]
      if (!descriptor) return

      if (descriptor.type === 'matrix') {
        state.matrixSettingsByViewId[viewId] = {
          ...state.matrixSettingsByViewId[viewId],
          hideIsolatedNodes: value,
        }
        return
      }

      state.nodeLinkSettingsByViewId[viewId] = {
        ...state.nodeLinkSettingsByViewId[viewId],
        hideIsolatedNodes: value,
      }
    })
  },
  setNetworkCircularLinkTension(state, action: PayloadAction<{ value: number }>) {
    const value = Math.min(Math.max(action.payload.value, 0), 1)
    state.controls.circularLinkTension = value
    state.viewsOrder.forEach((viewId) => {
      const descriptor = state.viewsById[viewId]
      if (descriptor?.type !== 'circular') return

      state.nodeLinkSettingsByViewId[viewId] = {
        ...state.nodeLinkSettingsByViewId[viewId],
        circularLinkTension: value,
      }
    })
  },
  setNetworkCircularBundlingEnabled(
    state,
    action: PayloadAction<{ value: boolean }>,
  ) {
    const { value } = action.payload
    state.controls.circularBundlingEnabled = value
    state.viewsOrder.forEach((viewId) => {
      const descriptor = state.viewsById[viewId]
      if (descriptor?.type !== 'circular') return

      state.nodeLinkSettingsByViewId[viewId] = {
        ...state.nodeLinkSettingsByViewId[viewId],
        circularBundlingEnabled: value,
      }
    })
  },
  setNetworkCircularEdgeSettings(
    state,
    action: PayloadAction<{
      linkTension: number
      bundlingEnabled: boolean
      positiveLinkColor: string
      negativeLinkColor: string
    }>,
  ) {
    const linkTension = Math.min(Math.max(action.payload.linkTension, 0), 1)
    const {
      bundlingEnabled,
      positiveLinkColor,
      negativeLinkColor,
    } = action.payload

    state.controls.circularLinkTension = linkTension
    state.controls.circularBundlingEnabled = bundlingEnabled
    state.controls.circularPositiveLinkColor = positiveLinkColor
    state.controls.circularNegativeLinkColor = negativeLinkColor

    state.viewsOrder.forEach((viewId) => {
      const descriptor = state.viewsById[viewId]
      if (descriptor?.type !== 'circular') return

      state.nodeLinkSettingsByViewId[viewId] = {
        ...state.nodeLinkSettingsByViewId[viewId],
        circularLinkTension: linkTension,
        circularBundlingEnabled: bundlingEnabled,
        circularPositiveLinkColor: positiveLinkColor,
        circularNegativeLinkColor: negativeLinkColor,
      }
    })
  },
} satisfies SliceCaseReducers<NetworkVisualizationState>
