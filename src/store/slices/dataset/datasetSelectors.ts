import { createSelector } from '@reduxjs/toolkit'

import type { ConnectivityMatrix } from '@/types/connectivityBundle'
import type { DatasetContent, DatasetMeta } from '@/types/datasetState'
import type { StoredMatrix } from '@/types/matrixStore'
import type { RootState } from '@/types/store'
import { toStoredMatrix } from '@/utils/datasetAccessors'

import { matricesAdapter } from './utils/matricesAdapter'

export const selectDatasetState = (state: RootState) => state.dataset
const matrixSelectors = matricesAdapter.getSelectors(
  (state: RootState) => state.dataset.matrices,
)

export const selectAllDatasetMatrices = matrixSelectors.selectAll
export const selectDatasetMatrixById = matrixSelectors.selectById
export const selectDatasetMatrixEntities = matrixSelectors.selectEntities

export const selectDatasetContent = createSelector(
  [
    selectDatasetState,
    selectAllDatasetMatrices,
    selectDatasetMatrixEntities,
  ],
  (dataset, matrices, matrixEntities): DatasetContent | null => {
    if (
      dataset.schemaVersion === null ||
      dataset.loadedBundle === null ||
      dataset.atlas === null ||
      dataset.catalogs === null ||
      dataset.roiOrderHash === null
    ) {
      return null
    }

    return {
      schemaVersion: dataset.schemaVersion,
      loadedBundle: dataset.loadedBundle,
      atlas: dataset.atlas,
      roiOrderHash: dataset.roiOrderHash,
      catalogs: dataset.catalogs,
      matrices,
      matrixIndex: matrixEntities as Record<string, ConnectivityMatrix>,
    }
  },
)

export const selectDatasetData = createSelector(
  [selectDatasetContent],
  (content): DatasetMeta | null => (content ? { content } : null),
)

const selectMatrixByCompoundId = createSelector(
  [selectAllDatasetMatrices],
  (matrices) =>
    Object.fromEntries(
      matrices.map((matrix) => {
        const stored = toStoredMatrix(matrix)
        return [stored.compoundId, stored]
      }),
    ) as Record<string, StoredMatrix>,
)

export const selectDatasetViewData = createSelector(
  [selectDatasetData, selectMatrixByCompoundId],
  (dataset, matrixByCompoundId) => ({
    dataset,
    matrixByCompoundId,
  }),
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
