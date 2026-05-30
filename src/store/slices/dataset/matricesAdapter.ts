import { createEntityAdapter } from '@reduxjs/toolkit'
import type { MatrixRecord } from '@/types/connectivityBundle'

export const matricesAdapter = createEntityAdapter<MatrixRecord, string>({
  selectId: (matrix) => matrix.id,
})
