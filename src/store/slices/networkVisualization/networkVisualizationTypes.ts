import type {
  MatrixNetworkViewSettings,
  NetworkPanelLayoutItem,
  NetworkSelectorControlsState,
  NetworkViewDescriptor,
  NodeLinkNetworkViewSettings,
} from '@/types/networkVisualization'

export type NetworkVisualizationState = {
  controls: NetworkSelectorControlsState
  viewsOrder: string[]
  viewsById: Record<string, NetworkViewDescriptor>
  layout: NetworkPanelLayoutItem[]
  matrixSettingsByViewId: Record<string, MatrixNetworkViewSettings>
  nodeLinkSettingsByViewId: Record<string, NodeLinkNetworkViewSettings>
  nextViewSeq: number
}

export type NetworkViewFormattingError = {
  viewId: string
  error: string
}

export type SetNetworkViewStatusPayload = {
  viewId: string
  status: NetworkViewDescriptor['status']
  error?: string
}

export const initialNetworkControls: NetworkSelectorControlsState = {
  viewType: 'matrix',
  populationKey: '',
  measureId: '',
  statId: '',
  bandId: '',
  selectedCompoundId: '',
  syncZoom: false,
  hideIsolatedNodes: true,
}

export const initialNetworkVisualizationState: NetworkVisualizationState = {
  controls: { ...initialNetworkControls },
  viewsOrder: [],
  viewsById: {},
  layout: [],
  matrixSettingsByViewId: {},
  nodeLinkSettingsByViewId: {},
  nextViewSeq: 1,
}
