import type { StatRangeValue } from '@/types/matrixView'
import type {
  MatrixNetworkViewSettings,
  NetworkViewType,
  NodeLinkNetworkViewSettings,
  SharedNetworkViewSettings,
  ZoomSelection,
} from '@/types/networkVisualization'
import { areZoomSelectionsEqual } from '@/utils/matrixViewUtils'

import type { NetworkVisualizationState } from '../networkVisualizationTypes'

export const getSharedSettings = (
  source?: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings,
): SharedNetworkViewSettings => {
  if (!source) return {}
  return {
    labels: source.labels,
    statRange: source.statRange,
    measureRange: source.measureRange,
    hideIsolatedNodes: source.hideIsolatedNodes,
    zoomHistory: source.zoomHistory,
    zoomIndex: source.zoomIndex,
    selectionVisible: source.selectionVisible,
    zoomLinkPercent: source.zoomLinkPercent,
    percentLinkFilter: source.percentLinkFilter,
    useAsNodeFilter: source.useAsNodeFilter,
    useAsLinkFilter: source.useAsLinkFilter,
  }
}

export const clearFilterSourceFromOtherViews = (
  state: NetworkVisualizationState,
  activeViewId: string,
) => {
  state.viewsOrder.forEach((viewId) => {
    if (viewId === activeViewId) return

    const matrixSettings = state.matrixSettingsByViewId[viewId]
    if (matrixSettings) {
      matrixSettings.useAsNodeFilter = false
      matrixSettings.useAsLinkFilter = false
    }

    const nodeLinkSettings = state.nodeLinkSettingsByViewId[viewId]
    if (nodeLinkSettings) {
      nodeLinkSettings.useAsNodeFilter = false
      nodeLinkSettings.useAsLinkFilter = false
    }
  })
}

export const ensureSettingsEntry = (
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

export const setStatRange = (
  settings: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings,
  value: [number, number],
  segment?: 'negative' | 'positive',
  fallback?: StatRangeValue,
  enabled?: boolean,
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
    ...(enabled === undefined ? {} : { [`${segment}Enabled`]: enabled }),
  }
}

export const getZoomHistory = (
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

export const updateZoomSelection = (
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

export const stepZoomSelection = (
  settings: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings,
  delta: -1 | 1,
) => {
  const { history, index } = getZoomHistory(settings)
  const nextIndex = Math.min(Math.max(index + delta, 0), history.length - 1)
  if (nextIndex === index) return false
  settings.zoomIndex = nextIndex
  return true
}
