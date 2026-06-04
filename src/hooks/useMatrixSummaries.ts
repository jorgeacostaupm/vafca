import { useEffect } from 'react'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  ensureMatrixSummariesLoaded,
  selectMatrixSummaries,
  selectMatrixSummariesError,
  selectMatrixSummariesStatus,
} from '@/store/slices/matrixSummaries'

export const useMatrixSummaries = (reloadKey?: string | number) => {
  const dispatch = useAppDispatch()
  const summaries = useAppSelector(selectMatrixSummaries)
  const status = useAppSelector(selectMatrixSummariesStatus)
  const error = useAppSelector(selectMatrixSummariesError)

  useEffect(() => {
    void dispatch(ensureMatrixSummariesLoaded({ force: reloadKey !== undefined }))
  }, [dispatch, reloadKey])

  return { summaries, status, error }
}
