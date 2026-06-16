import type { DatasetOperationsState } from '@/types/datasetState'

export type DatasetOperationsSliceState = DatasetOperationsState

export const initialDatasetOperationsState: DatasetOperationsSliceState = {
  status: 'idle',
  error: null,
  downloadStatus: 'idle',
  downloadError: null,
  networkImportStatus: 'idle',
  networkImportError: null,
  lastNetworkImport: null,
  derivedCalculationStatus: 'idle',
  derivedCalculationError: null,
}
