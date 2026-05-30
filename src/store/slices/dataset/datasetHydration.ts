import type { DatasetContent, DatasetState } from '@/types/datasetState'
import { matricesAdapter } from './matricesAdapter'

export const hydrateDatasetStateFromContent = (
  state: DatasetState,
  content: DatasetContent,
) => {
  state.schemaVersion = content.schemaVersion
  state.loadedBundle = content.loadedBundle
  state.atlas = content.atlas
  state.roiOrderHash = content.roiOrderHash
  state.catalogs = content.catalogs
  matricesAdapter.setAll(state.matrices, content.matrices)
}
