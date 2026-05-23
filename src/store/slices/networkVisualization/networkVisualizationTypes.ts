import type {
  MatrixNetworkViewSettings,
  NetworkPanelLayoutItem,
  NetworkSelectorControlsState,
  NetworkViewDescriptor,
  NetworkViewType,
  NodeLinkNetworkViewSettings,
} from '@/types/networkVisualization'
import type { MatrixFilterDefinition, RuntimeEdgeMask } from '@/types/edgeFilter'
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
  layout: NetworkPanelLayoutItem[]
  matrixSettingsByViewId: Record<string, MatrixNetworkViewSettings>
  nodeLinkSettingsByViewId: Record<string, NodeLinkNetworkViewSettings>
  activeNetworkFilter: MatrixFilterDefinition | null
  activeEdgeMask: RuntimeEdgeMask | null
  activeAggregatedNetworkFilter: MatrixFilterDefinition | null
  activeAggregatedEdgeMask: RuntimeEdgeMask | null
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
  layout: [],
  matrixSettingsByViewId: {},
  nodeLinkSettingsByViewId: {},
  activeNetworkFilter: null,
  activeEdgeMask: null,
  activeAggregatedNetworkFilter: null,
  activeAggregatedEdgeMask: null,
  nextViewSeq: DEFAULT_NETWORK_NEXT_VIEW_SEQ,
}
