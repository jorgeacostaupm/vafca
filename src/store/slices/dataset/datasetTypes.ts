import type { DatasetState } from '@/types/datasetState'

export type DatasetSliceState = DatasetState

export const initialDatasetState: DatasetSliceState = {
  data: null,
  status: 'idle',
  error: null,
  downloadStatus: 'idle',
  downloadError: null,
}
