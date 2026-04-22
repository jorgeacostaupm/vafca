import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { ensureMatricesByCompoundIds } from '@/store/slices/matrixCache'

export const useSelectedLinkMatrixCache = (selectedMatrixIds: string[]) => {
  const dispatch = useAppDispatch()
  const matrixCache = useAppSelector((state) => state.matrixCache.byCompoundId)
  const loadingByCompoundId = useAppSelector(
    (state) => state.matrixCache.loadingByCompoundId,
  )

  useEffect(() => {
    void dispatch(
      ensureMatricesByCompoundIds({
        compoundIds: selectedMatrixIds,
      }),
    )
  }, [dispatch, selectedMatrixIds])

  const loadingMatrices = useMemo(
    () =>
      selectedMatrixIds.some(
        (compoundId) =>
          loadingByCompoundId[compoundId] || !(compoundId in matrixCache),
      ),
    [loadingByCompoundId, matrixCache, selectedMatrixIds],
  )

  return {
    matrixCache,
    loadingMatrices,
  }
}
