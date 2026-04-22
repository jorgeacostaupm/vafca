import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { areZoomSelectionsEqual } from '@/utils/matrixViewUtils'
import type {
  MatrixNetworkViewSettings,
  NetworkPanelLayoutItem,
  NetworkSelectorControlsState,
  NetworkViewType,
  NodeLinkNetworkViewSettings,
  SharedNetworkViewSettings,
  ZoomSelection,
} from '@/types/networkVisualization'
import type { StatRangeValue } from '@/types/matrixView'
import {
  initialNetworkControls,
  initialNetworkVisualizationState,
  type NetworkVisualizationState,
  type SetNetworkViewStatusPayload,
} from './networkVisualizationTypes'

const getSharedSettings = (
  source?: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings,
): SharedNetworkViewSettings => {
  if (!source) return {}
  return {
    labels: source.labels,
    statRange: source.statRange,
    measureRange: source.measureRange,
    hideIsolatedNodes: source.hideIsolatedNodes,
    zoomLabelSelection: source.zoomLabelSelection,
    zoomHistory: source.zoomHistory,
    zoomIndex: source.zoomIndex,
    useAsNodeFilter: source.useAsNodeFilter,
    nodeFilterMode: source.nodeFilterMode,
    useAsLinkFilter: source.useAsLinkFilter,
    linkFilterMode: source.linkFilterMode,
  }
}

const getZoomHistory = (
  settings?: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings,
) => {
  const history = settings?.zoomHistory ?? [null]
  const index = Math.min(settings?.zoomIndex ?? 0, history.length - 1)
  return {
    history,
    index,
    current: history[index] ?? null,
  }
}

const ensureSettingsEntry = (
  state: NetworkVisualizationState,
  viewId: string,
  type: NetworkViewType,
) => {
  if (type === 'matrix') {
    state.matrixSettingsByViewId[viewId] = {
      ...(state.matrixSettingsByViewId[viewId] ?? {}),
    }
    return state.matrixSettingsByViewId[viewId]
  }

  state.nodeLinkSettingsByViewId[viewId] = {
    ...(state.nodeLinkSettingsByViewId[viewId] ?? {}),
  }
  return state.nodeLinkSettingsByViewId[viewId]
}

const setStatRange = (
  settings: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings,
  value: [number, number],
  segment?: 'negative' | 'positive',
  fallback?: StatRangeValue,
) => {
  if (!segment) {
    settings.statRange = value
    return
  }

  const current = settings.statRange
  const fallbackRange =
    fallback && !Array.isArray(fallback) ? fallback : undefined
  const base =
    current && !Array.isArray(current)
      ? current
      : fallbackRange
        ? fallbackRange
        : { negative: value, positive: value }

  settings.statRange = {
    ...base,
    [segment]: value,
  }
}

const updateZoomSelection = (
  settings: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings,
  selection: ZoomSelection,
) => {
  const { history, index, current } = getZoomHistory(settings)
  if (areZoomSelectionsEqual(current, selection)) return false
  const nextHistory = history.slice(0, index + 1)
  nextHistory.push(selection)
  settings.zoomHistory = nextHistory
  settings.zoomIndex = nextHistory.length - 1
  return true
}

const stepZoomSelection = (
  settings: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings,
  delta: -1 | 1,
) => {
  const { history, index } = getZoomHistory(settings)
  const nextIndex = Math.min(Math.max(index + delta, 0), history.length - 1)
  if (nextIndex === index) return false
  settings.zoomIndex = nextIndex
  return true
}

const networkVisualizationSlice = createSlice({
  name: 'networkVisualization',
  initialState: initialNetworkVisualizationState,
  reducers: {
    setNetworkViewStatus(state, action: PayloadAction<SetNetworkViewStatusPayload>) {
      const { viewId, status, error } = action.payload
      const target = state.viewsById[viewId]
      if (!target) return
      target.status = status
      target.error = error
    },
    patchNetworkControls(
      state,
      action: PayloadAction<Partial<NetworkSelectorControlsState>>,
    ) {
      state.controls = {
        ...state.controls,
        ...action.payload,
      }
    },
    resetNetworkControls(state) {
      state.controls = { ...initialNetworkControls }
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
        }
      }
    },
    removeNetworkView(state, action: PayloadAction<{ viewId: string }>) {
      const { viewId } = action.payload
      delete state.viewsById[viewId]
      state.viewsOrder = state.viewsOrder.filter((id) => id !== viewId)
      state.layout = state.layout.filter((item) => item.i !== viewId)
      delete state.matrixSettingsByViewId[viewId]
      delete state.nodeLinkSettingsByViewId[viewId]
    },
    clearNetworkViews(state) {
      state.viewsOrder = []
      state.viewsById = {}
      state.layout = []
      state.matrixSettingsByViewId = {}
      state.nodeLinkSettingsByViewId = {}
      state.nextViewSeq = 1
    },
    mutateNetworkViewTypeLocally(
      state,
      action: PayloadAction<{ viewId: string; nextType: NetworkViewType }>,
    ) {
      const { viewId, nextType } = action.payload
      const target = state.viewsById[viewId]
      if (!target) return
      if (target.type === nextType) return

      const currentType = target.type
      if (currentType === 'matrix') {
        const source = state.matrixSettingsByViewId[viewId]
        const shared = getSharedSettings(source)
        delete state.matrixSettingsByViewId[viewId]
        state.nodeLinkSettingsByViewId[viewId] = {
          ...state.nodeLinkSettingsByViewId[viewId],
          ...shared,
        }
      } else {
        const source = state.nodeLinkSettingsByViewId[viewId]
        const shared = getSharedSettings(source)
        delete state.nodeLinkSettingsByViewId[viewId]
        state.matrixSettingsByViewId[viewId] = {
          ...state.matrixSettingsByViewId[viewId],
          ...shared,
        }
      }

      target.type = nextType
      target.error = undefined
    },
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
    },
    setNetworkHideIsolatedNodes(
      state,
      action: PayloadAction<{ value: boolean }>,
    ) {
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
      }>,
    ) {
      const { viewId, value, segment, fallback } = action.payload
      const target = state.viewsById[viewId]
      if (!target) return

      const settings = ensureSettingsEntry(state, viewId, target.type)
      setStatRange(settings, value, segment, fallback)
    },
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
    setNetworkLayout(state, action: PayloadAction<NetworkPanelLayoutItem[]>) {
      state.layout = action.payload.map((entry) => ({ ...entry }))
    },
    addNetworkLayoutItem(
      state,
      action: PayloadAction<{
        viewId: string
        defaultW?: number
        defaultH?: number
        columns?: number
        yOffset?: number
      }>,
    ) {
      const { viewId } = action.payload
      const defaultW = action.payload.defaultW ?? 8
      const defaultH = action.payload.defaultH ?? 5
      const columns = action.payload.columns ?? 3
      const yOffset = action.payload.yOffset ?? defaultH
      const x = (state.layout.length % columns) * defaultW

      state.layout = [
        { i: viewId, x, y: 0, w: defaultW, h: defaultH },
        ...state.layout.map((entry) => ({
          ...entry,
          y: entry.y + yOffset,
        })),
      ]
    },
    removeNetworkLayoutItem(
      state,
      action: PayloadAction<{ viewId: string }>,
    ) {
      state.layout = state.layout.filter((entry) => entry.i !== action.payload.viewId)
    },
  },
})

export const {
  setNetworkViewStatus,
  patchNetworkControls,
  resetNetworkControls,
  addNetworkView,
  removeNetworkView,
  clearNetworkViews,
  mutateNetworkViewTypeLocally,
  patchNetworkMatrixSettings,
  patchNetworkNodeLinkSettings,
  setNetworkHideIsolatedNodes,
  resetNetworkViewSettings,
  updateNetworkViewStatRange,
  applyNetworkZoom,
  stepNetworkZoomHistory,
  toggleNetworkZoomLabelSelection,
  resetNetworkZoomLabelSelection,
  setNetworkLayout,
  addNetworkLayoutItem,
  removeNetworkLayoutItem,
} = networkVisualizationSlice.actions

export default networkVisualizationSlice.reducer
