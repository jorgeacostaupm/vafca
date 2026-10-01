import type { DatasetContent, DatasetState } from '@/types/datasetState'
import { computeNetworkDataStats } from '@/utils/networkDataStats'

import { networksAdapter } from './networksAdapter'

export const hydrateDatasetStateFromContent = (
  state: DatasetState,
  content: DatasetContent,
) => {
  state.id = content.id
  state.label = content.label
  state.description = content.description ?? null
  state.createdAt = content.createdAt ?? null
  state.nodeSet = content.nodeSet
  state.catalogs = content.catalogs
  networksAdapter.setAll(state.networks, content.networks.map(network =>
    network.dataStats ? network : { ...network, dataStats: computeNetworkDataStats(network) },
  ))
}
