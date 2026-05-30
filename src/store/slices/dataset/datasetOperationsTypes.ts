import type { DatasetOperationsState } from '@/types/datasetState'

export type DatasetOperationsSliceState = DatasetOperationsState

export const initialDatasetOperationsState: DatasetOperationsSliceState = {
  status: 'idle',
  error: null,
  downloadStatus: 'idle',
  downloadError: null,
  matrixUploadStatus: 'idle',
  matrixUploadError: null,
  lastMatrixUpload: null,
  derivedCalculationStatus: 'idle',
  derivedCalculationError: null,
}
