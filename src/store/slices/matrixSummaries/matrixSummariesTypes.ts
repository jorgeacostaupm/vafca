import type { MatrixSummary } from '@/types/matrixStore'

export type MatrixSummariesStatus = 'idle' | 'loading' | 'ready' | 'error'

export type MatrixSummariesSliceState = {
  summaries: MatrixSummary[]
  status: MatrixSummariesStatus
  error: string | null
}

export const initialMatrixSummariesState: MatrixSummariesSliceState = {
  summaries: [],
  status: 'idle',
  error: null,
}
