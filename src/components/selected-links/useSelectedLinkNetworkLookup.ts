import { useMemo } from 'react'

import { useAppSelector } from '@/store/hooks'
import { selectDatasetData } from '@/store/slices/dataset'
import { getMaterializedNetworkByCompoundId } from '@/utils/datasetAccessors'

export const useSelectedLinkNetworkLookup = (selectedNetworkIds: string[]) => {
  const dataset = useAppSelector(selectDatasetData)

  const networkLookup = useMemo(
    () =>
      Object.fromEntries(
        selectedNetworkIds.map((compoundId) => [
          compoundId,
          getMaterializedNetworkByCompoundId(dataset, compoundId) ?? null,
        ]),
      ),
    [dataset, selectedNetworkIds],
  )

  return {
    networkLookup,
    loadingNetworks: false,
  }
}
