import { useEffect } from 'react'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  ensureNetworkSummariesLoaded,
  selectNetworkSummaries,
  selectNetworkSummariesError,
  selectNetworkSummariesStatus,
} from '@/store/slices/networkSummaries'

export const useNetworkSummaries = (reloadKey?: string | number) => {
  const dispatch = useAppDispatch()
  const summaries = useAppSelector(selectNetworkSummaries)
  const status = useAppSelector(selectNetworkSummariesStatus)
  const error = useAppSelector(selectNetworkSummariesError)

  useEffect(() => {
    void dispatch(ensureNetworkSummariesLoaded({ force: reloadKey !== undefined }))
  }, [dispatch, reloadKey])

  return { summaries, status, error }
}
