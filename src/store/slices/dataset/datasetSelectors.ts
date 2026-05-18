import type { RootState } from '@/types/store'

export const selectDatasetState = (state: RootState) => state.dataset
export const selectDatasetData = (state: RootState) => state.dataset.data
export const selectDatasetStatus = (state: RootState) => state.dataset.status
export const selectDatasetError = (state: RootState) => state.dataset.error
export const selectDatasetDownloadStatus = (state: RootState) =>
  state.dataset.downloadStatus
export const selectDatasetDownloadError = (state: RootState) =>
  state.dataset.downloadError
export const selectDerivedCalculationStatus = (state: RootState) =>
  state.dataset.derivedCalculationStatus
export const selectDerivedCalculationError = (state: RootState) =>
  state.dataset.derivedCalculationError
