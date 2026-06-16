import type { RootState } from '@/types/store'

export const selectNetworkSummariesState = (state: RootState) =>
  state.networkSummaries
export const selectNetworkSummaries = (state: RootState) =>
  state.networkSummaries.summaries
export const selectNetworkSummariesStatus = (state: RootState) =>
  state.networkSummaries.status
export const selectNetworkSummariesError = (state: RootState) =>
  state.networkSummaries.error
