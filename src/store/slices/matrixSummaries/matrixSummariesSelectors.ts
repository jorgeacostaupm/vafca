import type { RootState } from '@/types/store'

export const selectMatrixSummariesState = (state: RootState) =>
  state.matrixSummaries
export const selectMatrixSummaries = (state: RootState) =>
  state.matrixSummaries.summaries
export const selectMatrixSummariesStatus = (state: RootState) =>
  state.matrixSummaries.status
export const selectMatrixSummariesError = (state: RootState) =>
  state.matrixSummaries.error
