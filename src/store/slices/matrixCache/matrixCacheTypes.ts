import type { StoredMatrix } from '@/types/matrixStore'

export type MatrixCacheFetchResult = {
  compoundId: string
  matrix: StoredMatrix | null
  error?: string
}

export type MatrixCacheSliceState = {
  byCompoundId: Record<string, StoredMatrix | null>
  loadingByCompoundId: Record<string, boolean>
  errorByCompoundId: Record<string, string | null>
}

export const initialMatrixCacheState: MatrixCacheSliceState = {
  byCompoundId: {},
  loadingByCompoundId: {},
  errorByCompoundId: {},
}
