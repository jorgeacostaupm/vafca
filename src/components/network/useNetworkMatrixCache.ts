import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { ensureMatricesByCompoundIds } from '@/store/slices/matrixCache'
import type { NetworkViewDescriptor } from '@/types/networkVisualization'

export const useNetworkMatrixCache = (views: NetworkViewDescriptor[]) => {
  const dispatch = useAppDispatch()
  const matrixByCompoundId = useAppSelector((state) => state.matrixCache.byCompoundId)
  const loadingByCompoundId = useAppSelector(
    (state) => state.matrixCache.loadingByCompoundId,
  )

  const targetCompoundIds = useMemo(
    () => Array.from(new Set(views.map((view) => view.compoundId))),
    [views],
  );

  useEffect(() => {
    void dispatch(
      ensureMatricesByCompoundIds({
        compoundIds: targetCompoundIds,
      }),
    )
  }, [dispatch, targetCompoundIds])

  const loadingCompoundIds = useMemo(
    () =>
      new Set(
        targetCompoundIds.filter(
          (compoundId) =>
            loadingByCompoundId[compoundId] || !(compoundId in matrixByCompoundId),
        ),
      ),
    [loadingByCompoundId, matrixByCompoundId, targetCompoundIds],
  )

  return {
    matrixByCompoundId,
    loadingCompoundIds,
  }
}
