import { createAsyncThunk } from '@reduxjs/toolkit'
import { getMatrix } from '@/utils/matrixStore'
import type { RootState } from '@/types/store'
import type { MatrixCacheFetchResult } from './matrixCacheTypes'

export const fetchMatricesByCompoundIds = createAsyncThunk<
  MatrixCacheFetchResult[],
  { compoundIds: string[] },
  { state: RootState }
>(
  'matrixCache/fetchMatricesByCompoundIds',
  async ({ compoundIds }, { getState }) => {
    const uniqueIds = Array.from(new Set(compoundIds.filter(Boolean)))
    const { byCompoundId } = getState().matrixCache
    const idsToLoad = uniqueIds.filter((id) => !(id in byCompoundId))

    if (idsToLoad.length === 0) return []

    return Promise.all(
      idsToLoad.map(async (compoundId) => {
        try {
          const matrix = await getMatrix(compoundId)
          return {
            compoundId,
            matrix: matrix ?? null,
          }
        } catch (error) {
          return {
            compoundId,
            matrix: null,
            error:
              error instanceof Error ? error.message : 'Failed to load matrix.',
          }
        }
      }),
    )
  },
)

export const ensureMatricesByCompoundIds = createAsyncThunk<
  void,
  { compoundIds: string[] },
  { state: RootState }
>(
  'matrixCache/ensureMatricesByCompoundIds',
  async ({ compoundIds }, { dispatch }) => {
    if (compoundIds.length === 0) return
    await dispatch(fetchMatricesByCompoundIds({ compoundIds }))
  },
)
