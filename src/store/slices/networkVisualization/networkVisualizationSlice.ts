import { createSlice } from '@reduxjs/toolkit'

import { initialNetworkVisualizationState } from './networkVisualizationTypes'
import { networkControlReducers } from './reducers/networkControlReducers'
import { networkSettingsReducers } from './reducers/networkSettingsReducers'
import { networkViewReducers } from './reducers/networkViewReducers'
import { networkZoomReducers } from './reducers/networkZoomReducers'

const networkVisualizationSlice = createSlice({
  name: 'networkVisualization',
  initialState: initialNetworkVisualizationState,
  reducers: {
    ...networkViewReducers,
    ...networkControlReducers,
    ...networkSettingsReducers,
    ...networkZoomReducers,
  },
})

export const {
  setNetworkViewStatus,
  patchNetworkControls,
  pruneNetworkSelectionForDisabledCatalogItem,
  resetNetworkControls,
  addNetworkView,
  removeNetworkView,
  clearNetworkViews,
  mutateNetworkViewTypeLocally,
  patchNetworkMatrixSettings,
  patchNetworkNodeLinkSettings,
  setNetworkHideIsolatedNodes,
  setNetworkCircularBundlingEnabled,
  setNetworkCircularEdgeSettings,
  setNetworkCircularLinkTension,
  resetNetworkViewSettings,
  updateNetworkViewStatRange,
  applyNetworkZoom,
  stepNetworkZoomHistory,
  toggleNetworkZoomLabelSelection,
  resetNetworkZoomLabelSelection,
} = networkVisualizationSlice.actions

export default networkVisualizationSlice.reducer
