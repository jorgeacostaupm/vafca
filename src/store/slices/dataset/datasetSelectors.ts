import { createSelector } from '@reduxjs/toolkit'

import type { DatasetNetworkSummary } from '@/types/datasetNetworkView'
import type { DatasetContent, DatasetMeta } from '@/types/datasetState'
import type { Network } from '@/types/network'
import type { RootState } from '@/types/store'
import { toDatasetNetworkSummary } from '@/utils/datasetAccessors'

import { networksAdapter } from './utils/networksAdapter'

export const selectDatasetState = (state: RootState) => state.dataset
const networkSelectors = networksAdapter.getSelectors(
  (state: RootState) => state.dataset.networks,
)

export const selectAllDatasetNetworks = networkSelectors.selectAll
export const selectDatasetNetworkById = networkSelectors.selectById
export const selectDatasetNetworkEntities = networkSelectors.selectEntities

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
export const selectDatasetDownloadError = (state: RootState) =>
  state.datasetOperations.downloadError
export const selectDerivedCalculationStatus = (state: RootState) =>
  state.datasetOperations.derivedCalculationStatus
export const selectDerivedCalculationError = (state: RootState) =>
  state.datasetOperations.derivedCalculationError
