import { useMemo } from 'react'

import { useAppSelector } from '@/store/hooks'
import { selectDatasetData } from '@/store/slices/dataset'
import { getDatasetNetworkByCompoundId } from '@/utils/datasetAccessors'

export const useSelectedLinkNetworkLookup = (selectedNetworkIds: string[]) => {
  const dataset = useAppSelector(selectDatasetData)

  const networkLookup = useMemo(
    () =>
      Object.fromEntries(
        selectedNetworkIds.map((compoundId) => [
          compoundId,
          getDatasetNetworkByCompoundId(dataset, compoundId) ?? null,
        ]),
      ),
    [dataset, selectedNetworkIds],
  )

  return {
    networkLookup,
    loadingNetworks: false,
  }
}
