import { createSlice } from '@reduxjs/toolkit'

import { catalogItemUpdated } from '@/store/actions/catalogItemUpdated'

import { initialNetworkVisualizationState } from './networkVisualizationTypes'
import { networkControlReducers } from './reducers/networkControlReducers'
import { networkSettingsReducers } from './reducers/networkSettingsReducers'
import { networkViewReducers } from './reducers/networkViewReducers'
import { networkZoomReducers } from './reducers/networkZoomReducers'

const networkVisualizationSlice = createSlice({
  name: 'networkVisualization',
  initialState: initialNetworkVisualizationState,
  extraReducers: builder => {
    builder.addCase(catalogItemUpdated, (state, { payload }) => {
      if (payload.prune) {
        networkControlReducers.pruneNetworkSelectionForDisabledCatalogItem(state, {
          type: catalogItemUpdated.type, payload: payload.prune,
        })
      }
    })
  },
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
	  addTemporaryAggregatedNetworkView,
	  setTemporaryAggregatedNetwork,
  renameAggregatedGroups,
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
