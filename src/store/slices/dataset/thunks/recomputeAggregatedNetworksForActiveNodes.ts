import { createAsyncThunk } from '@reduxjs/toolkit'

import {
  type AggregatedNetworkOrderMode,
  buildNodeGroupsFromMetadata,
  computeAggregatedNetworkData,
  createAggregatedNetwork,
  hashGroupOrder,
  hashNodeSet,
} from '@/networkDerivation/aggregation/nodeGroupAggregation'
import type { Network } from '@/types/network'
import type { RootState } from '@/types/store'

import { selectDatasetContent } from '../datasetSelectors'

export type RecomputeAggregatedNetworksForActiveNodesResult = {
  networks: Network[]
  skippedNetworkIds: string[]
}

export const recomputeAggregatedNetworksForActiveNodes = createAsyncThunk<
  RecomputeAggregatedNetworksForActiveNodesResult,
  void,
  { state: RootState; rejectValue: string }
>(
  'dataset/recomputeAggregatedNetworksForActiveNodes',
  async (_, { getState, rejectWithValue }) => {
    const state = getState()
    const datasetContent = selectDatasetContent(state)
    if (!datasetContent) return rejectWithValue('No dataset is loaded.')

    const activeNodeIds = state.atlasUi.order.filter(
      (id) => state.atlasUi.labelsById[id]?.enabled !== false,
    )
    const activeNodeSet = new Set(activeNodeIds)
    const activeNodeSetHash = hashNodeSet(activeNodeIds)
    const aggregatedNetworks = datasetContent.networks.filter(
      (network) => network.derivation?.type === 'aggregation',
    )

    const networks: Network[] = []
    const skippedNetworkIds: string[] = []

    aggregatedNetworks.forEach((network) => {
      const aggregation = network.derivation
      if (aggregation?.type !== 'aggregation') return

      const baseNetwork = datasetContent.networkIndex[aggregation.baseNetworkId]
      if (!baseNetwork || baseNetwork.derivation?.type === 'aggregation') {
        skippedNetworkIds.push(network.id)
        return
      }

      const orderMode =
        (aggregation.parameters.orderMode as AggregatedNetworkOrderMode | undefined) ??
        'matrix'
      const missingTagPolicy =
        aggregation.parameters.missingNodePolicy ?? 'unknown_group'

      const groupResult = buildNodeGroupsFromMetadata({
        nodeSet: datasetContent.nodeSet,
        fields: aggregation.fields,
        categoryOrder: {},
        activeNodeIds: activeNodeSet,
        missingTagPolicy,
      })

      if (groupResult.groups.length < 2) {
        skippedNetworkIds.push(network.id)
        return
      }

      const groupOrderHash = hashGroupOrder(
        groupResult.groups.map((group) => group.id),
      )
      const computed = computeAggregatedNetworkData({
        baseNetwork,
        nodeSet: datasetContent.nodeSet,
        groups: groupResult.groups,
      })
      const nextNetwork = createAggregatedNetwork({
        baseNetwork,
        nodeSet: datasetContent.nodeSet,
        groups: groupResult.groups,
        data: computed.data,
        cellCounts: computed.cellCounts,
        fields: aggregation.fields,
        excludedNodeIds: groupResult.excludedNodeIds,
        activeNodeIds,
        activeNodeSetHash,
        groupOrderHash,
        orderMode,
        missingTagPolicy,
      })

      networks.push({
        ...nextNetwork,
        id: network.id,
        label: network.label,
        dimensions: { ...network.dimensions },
      })
    })

    return { networks, skippedNetworkIds }
  },
)
