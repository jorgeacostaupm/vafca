import type { DatasetState } from '@/types/datasetState'

import { matricesAdapter } from './utils/matricesAdapter'

export type DatasetSliceState = DatasetState

export const initialDatasetState: DatasetSliceState = {
  schemaVersion: null,
  loadedBundle: null,
  atlas: null,
  roiOrderHash: null,
  catalogs: null,
  matrices: matricesAdapter.getInitialState(),
}
