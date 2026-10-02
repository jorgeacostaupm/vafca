import { createSelector } from '@reduxjs/toolkit'

import { selectDatasetNetworkByCompoundId } from '@/store/slices/dataset/datasetSelectors'
import type { RootState } from '@/types/store'
import { buildNetworkSummaryLabel } from '@/utils/matrixViewUtils'

export const selectNetworkControls = (state: RootState) =>
  state.networkVisualization.controls
export const selectNetworkViewsOrder = (state: RootState) =>
  state.networkVisualization.viewsOrder
export const selectNetworkViewsById = (state: RootState) =>
  state.networkVisualization.viewsById

const selectView = (state: RootState, viewId: string) =>
  state.networkVisualization.viewsById[viewId]

export const selectNetworkViewWithCurrentLabel = createSelector(
  [
    selectView,
    (state: RootState) => state.dataset.catalogs,
    (state: RootState, viewId: string) => {
      const view = selectView(state, viewId)
      const temporary = view?.temporaryNetworkId
        ? state.networkVisualization.temporaryNetworksById[view.temporaryNetworkId]
        : undefined
      // Older workspaces encode the source compound ID in the view ID: "compoundId::sequence".
      const legacySourceId = temporary && (
        selectView(state, temporary.sourceViewId)?.compoundId ?? temporary.sourceViewId.replace(/::\d+$/, '')
      )
      const compoundId = view?.temporaryNetworkId
        ? view.sourceCompoundId ?? legacySourceId
        : view?.compoundId
      return selectDatasetNetworkByCompoundId(state, compoundId)
    },
  ],
  (view, catalogs, network) => {
    if (!view || !catalogs || !network) return view
    const label = buildNetworkSummaryLabel(network, catalogs) + (view.temporaryNetworkId ? ' aggregated' : '')
    return label === view.label ? view : { ...view, label }
  },
)
