import type { RootState } from '@/types/store'

export const selectMatrixCacheState = (state: RootState) => state.matrixCache
export const selectMatrixByCompoundId = (state: RootState) =>
  state.matrixCache.byCompoundId
export const selectMatrixLoadingByCompoundId = (state: RootState) =>
  state.matrixCache.loadingByCompoundId
export const selectMatrixErrorsByCompoundId = (state: RootState) =>
  state.matrixCache.errorByCompoundId
