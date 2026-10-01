import { useCallback, useEffect } from 'react'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import type { SelectedLink } from '@/types/visualizationUi'
import { patchWorkspaceUi } from '@/workspace/workspaceUiSlice'

export const useSelectedLinkNetworkSelection = (links: SelectedLink[]) => {
  const dispatch = useAppDispatch()
  const { selectedNetworkIds, dismissedNetworkIds } = useAppSelector(state => state.workspaceUi)
  useEffect(() => {
    const next = new Set(selectedNetworkIds)
    links.forEach(link => link.sources.forEach(source => {
      if (!dismissedNetworkIds.includes(source.compoundId)) next.add(source.compoundId)
    }))
    if (next.size !== selectedNetworkIds.length) dispatch(patchWorkspaceUi({ selectedNetworkIds: [...next] }))
  }, [dispatch, links, selectedNetworkIds, dismissedNetworkIds])
  const setUserSelectedNetworkIds = useCallback((next: string[]) => {
    const dismissed = new Set(dismissedNetworkIds)
    selectedNetworkIds.filter(id => !next.includes(id)).forEach(id => dismissed.add(id))
    next.forEach(id => dismissed.delete(id))
    dispatch(patchWorkspaceUi({ selectedNetworkIds: next, dismissedNetworkIds: [...dismissed] }))
  }, [dispatch, selectedNetworkIds, dismissedNetworkIds])
  return { selectedNetworkIds, setUserSelectedNetworkIds }
}
