import { createSelector } from '@reduxjs/toolkit'

import type { DatasetNetworkSummary } from '@/types/datasetNetworkView'
import type { DatasetContent, DatasetMeta } from '@/types/datasetState'
import type { Network } from '@/types/network'
import type { RootState } from '@/types/store'
import { toDatasetNetworkSummary, toMaterializedNetworkView } from '@/utils/datasetAccessors'
import { createNetworkCompoundId } from '@/utils/networkMetadata'

import { networksAdapter } from './utils/networksAdapter'

export const selectDatasetState = (state: RootState) => state.dataset
const networkSelectors = networksAdapter.getSelectors(
  (state: RootState) => state.dataset.networks,
)

export const selectAllDatasetNetworks = networkSelectors.selectAll
export const selectDatasetNetworkEntities = networkSelectors.selectEntities
export const selectDatasetNodeSet = (state: RootState) => state.dataset.nodeSet

export const selectNetworksByCompoundId = createSelector(
  [selectAllDatasetNetworks],
  networks => new Map(networks.map(network => [createNetworkCompoundId(network), network])),
)

export const selectDatasetNetworkByCompoundId = (state: RootState, compoundId?: string) =>
  compoundId ? selectNetworksByCompoundId(state).get(compoundId) : undefined

// Reselect's weak cache shares materialization between views and releases removed entities.
export const selectMaterializedNetworkByCompoundId = createSelector(
  [selectDatasetNetworkByCompoundId],
  network => network ? toMaterializedNetworkView(network) : null,
)

export const selectDatasetContent = createSelector(
  [
    selectDatasetState,
    selectAllDatasetNetworks,
    selectDatasetNetworkEntities,
  ],
  (dataset, networks, networkEntities): DatasetContent | null => {
    if (
      dataset.id === null ||
      dataset.label === null ||
      dataset.nodeSet === null ||
      dataset.catalogs === null
    ) {
      return null
    }

    return {
      id: dataset.id,
      label: dataset.label,
      description: dataset.description,
      createdAt: dataset.createdAt,
      nodeSet: dataset.nodeSet,
      catalogs: dataset.catalogs,
      networks,
      networkIndex: networkEntities as Record<string, Network>,
    }
  },
)

export const selectDatasetData = createSelector(
  [selectDatasetContent],
  (content): DatasetMeta | null => (content ? { content } : null),
)

export const selectDatasetNetworkSummaries = createSelector(
  [selectAllDatasetNetworks],
  (networks): DatasetNetworkSummary[] => networks.map(toDatasetNetworkSummary),
)

export const selectDatasetOperationsState = (state: RootState) =>
  state.datasetOperations
export const selectDatasetStatus = (state: RootState) =>
  state.datasetOperations.status
export const selectDatasetError = (state: RootState) =>
  state.datasetOperations.error
export const selectDatasetDownloadStatus = (state: RootState) =>
  state.datasetOperations.downloadStatus
export const selectDerivedCalculationStatus = (state: RootState) =>
  state.datasetOperations.derivedCalculationStatus
export const selectDerivedCalculationError = (state: RootState) =>
  state.datasetOperations.derivedCalculationError
