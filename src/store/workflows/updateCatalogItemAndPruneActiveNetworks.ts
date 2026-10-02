import { createAsyncThunk } from '@reduxjs/toolkit'

import { catalogItemUpdated } from '@/store/actions/catalogItemUpdated'
import { selectDatasetNetworkSummaries } from '@/store/slices/dataset/datasetSelectors'
import {
  type CatalogNetworkPrunePayload,
  getInvalidCompoundIdsForCatalogItem,
  getInvalidNetworkIdsForCatalogItem,
} from '@/store/slices/dataset/utils/catalogNetworkPruning'
import type { UpdateCatalogPayload } from '@/types/datasetState'
import type { RootState } from '@/types/store'

const shouldPruneActiveNetworks = (payload: UpdateCatalogPayload) =>
  payload.changes.enabled === false &&
  ['sources', 'measures', 'statistics', 'aspectCatalogs'].includes(payload.catalog)

const viewMatchesCatalogFallback = (
  view: RootState["networkVisualization"]["viewsById"][string],
  payload: CatalogNetworkPrunePayload,
) => {
  if (payload.catalog === 'measures') return view.measureId === payload.id
  if (payload.catalog === 'statistics') return view.statisticId === payload.id
  return false
}

export const updateCatalogItemAndPruneActiveNetworks = createAsyncThunk<
  void,
  UpdateCatalogPayload,
  { state: RootState }
>(
  'dataset/updateCatalogItemAndPruneActiveNetworks',
  async (payload, { dispatch, getState }) => {
    if (!getState().dataset.catalogs) return
    if (!shouldPruneActiveNetworks(payload)) {
      dispatch(catalogItemUpdated({ update: payload, viewIds: [] }))
      return
    }

    const state = getState()
    const invalidCompoundIds = getInvalidCompoundIdsForCatalogItem(
      selectDatasetNetworkSummaries(state),
      payload.catalog,
      payload.id,
    )
    const invalidNetworkIds = getInvalidNetworkIdsForCatalogItem(
      Object.values(state.dataset.networks.entities),
      payload.catalog,
      payload.id,
    )
    const invalidCompoundIdSet = new Set(invalidCompoundIds)
    const prunePayload: CatalogNetworkPrunePayload = {
      catalog: payload.catalog,
      id: payload.id,
      invalidCompoundIds,
      invalidNetworkIds,
    }
    const viewIds = state.networkVisualization.viewsOrder.filter((viewId) => {
      const view = state.networkVisualization.viewsById[viewId]
      if (!view) return false
      return (
        invalidCompoundIdSet.has(view.compoundId) ||
        viewMatchesCatalogFallback(view, prunePayload)
      )
    })

    dispatch(catalogItemUpdated({ update: payload, prune: prunePayload, viewIds }))
  },
)
