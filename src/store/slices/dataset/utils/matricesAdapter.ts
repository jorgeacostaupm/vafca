import { createEntityAdapter } from '@reduxjs/toolkit'

import type { ConnectivityMatrix } from '@/types/connectivityBundle'

export const matricesAdapter = createEntityAdapter<ConnectivityMatrix, string>({
  selectId: (matrix) => matrix.id,
})
