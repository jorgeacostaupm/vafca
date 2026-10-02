import { shallowEqual } from 'react-redux'

import { useAppSelector } from '@/store/hooks'
import { selectMaterializedNetworkByCompoundId } from '@/store/slices/dataset/datasetSelectors'

export const useSelectedLinkNetworkLookup = (selectedNetworkIds: string[]) => {
  const networkLookup = useAppSelector(
    state =>
      Object.fromEntries(
        selectedNetworkIds.map((compoundId) => [
          compoundId,
          selectMaterializedNetworkByCompoundId(state, compoundId),
        ]),
      ),
    shallowEqual,
  )

  return {
    networkLookup,
    loadingNetworks: false,
  }
}
