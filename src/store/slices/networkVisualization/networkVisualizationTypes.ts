import type {
  MatrixNetworkViewSettings,
  NetworkSelectorControlsState,
  NetworkViewDescriptor,
  NetworkViewType,
  NodeLinkNetworkViewSettings,
} from '@/types/networkVisualization'
import {
  DEFAULT_CIRCULAR_BUNDLING_ENABLED,
  DEFAULT_CIRCULAR_LINK_TENSION,
  DEFAULT_NETWORK_HIDE_ISOLATED_NODES,
  DEFAULT_NETWORK_MATRIX_SELECTOR_MODE,
  DEFAULT_NETWORK_NEXT_VIEW_SEQ,
  DEFAULT_NETWORK_SYNC_ZOOM,
  DEFAULT_NETWORK_VIEW_TYPE,
} from '@/config/ui'

export type NetworkVisualizationState = {
  controls: NetworkSelectorControlsState
  controlsByViewType: Partial<Record<NetworkViewType, NetworkSelectorControlsState>>
  viewsOrder: string[]
  viewsById: Record<string, NetworkViewDescriptor>
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
  viewType: DEFAULT_NETWORK_VIEW_TYPE,
  matrixSelectorMode: DEFAULT_NETWORK_MATRIX_SELECTOR_MODE,
  populationKey: '',
  measureId: '',
  statId: '',
  layerId: '',
  selectedCompoundId: '',
  syncZoom: DEFAULT_NETWORK_SYNC_ZOOM,
  hideIsolatedNodes: DEFAULT_NETWORK_HIDE_ISOLATED_NODES,
  circularLinkTension: DEFAULT_CIRCULAR_LINK_TENSION,
  circularBundlingEnabled: DEFAULT_CIRCULAR_BUNDLING_ENABLED,
}

export const initialNetworkVisualizationState: NetworkVisualizationState = {
  controls: { ...initialNetworkControls },
  controlsByViewType: {
    [initialNetworkControls.viewType]: { ...initialNetworkControls },
  },
  viewsOrder: [],
  viewsById: {},
  matrixSettingsByViewId: {},
  nodeLinkSettingsByViewId: {},
  nextViewSeq: DEFAULT_NETWORK_NEXT_VIEW_SEQ,
}
