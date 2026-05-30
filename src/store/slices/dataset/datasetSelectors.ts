import type { RootState } from '@/types/store'
import type { MatrixRecord } from '@/types/connectivityBundle'
import type { DatasetContent } from '@/types/datasetState'
import { matricesAdapter } from './matricesAdapter'

export const selectDatasetState = (state: RootState) => state.dataset
const matrixSelectors = matricesAdapter.getSelectors(
  (state: RootState) => state.dataset.matrices,
)

export const selectAllDatasetMatrices = matrixSelectors.selectAll
export const selectDatasetMatrixById = matrixSelectors.selectById
export const selectDatasetMatrixEntities = matrixSelectors.selectEntities

export const selectDatasetContent = (
  state: RootState,
): DatasetContent | null => {
  const dataset = state.dataset
  if (
    dataset.schemaVersion === null ||
    dataset.loadedBundle === null ||
    dataset.atlas === null ||
    dataset.catalogs === null ||
    dataset.roiOrderHash === null
  ) {
    return null
  }

  const matrices = selectAllDatasetMatrices(state)
  return {
    schemaVersion: dataset.schemaVersion,
    loadedBundle: dataset.loadedBundle,
    atlas: dataset.atlas,
    roiOrderHash: dataset.roiOrderHash,
    catalogs: dataset.catalogs,
    matrices,
    matrixIndex: dataset.matrices.entities as Record<string, MatrixRecord>,
  }
}

export const selectDatasetData = (state: RootState) => {
  const content = selectDatasetContent(state)
  return content ? { content } : null
}
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
