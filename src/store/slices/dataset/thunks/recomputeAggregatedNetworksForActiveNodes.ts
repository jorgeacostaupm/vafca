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

import { selectDatasetContent } from '../datasetSelectors'
import { yieldToBrowser } from '../utils/browserYield'
import { assertCalculationCurrent, type DatasetCalculationConfig } from '../utils/calculationSnapshot'

export type RecomputeAggregatedNetworksForActiveNodesResult = {
  networks: Network[]
  skippedNetworkIds: string[]
}

export const recomputeAggregatedNetworksForActiveNodes = createAsyncThunk<
  RecomputeAggregatedNetworksForActiveNodesResult,
  void,
  DatasetCalculationConfig
>(
  'dataset/recomputeAggregatedNetworksForActiveNodes',
  async (_, { getState, rejectWithValue, fulfillWithValue, signal }) => {
    const state = getState()
    const datasetRevision = state.dataset.revision
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

    for (const network of aggregatedNetworks) {
      await yieldToBrowser()
      assertCalculationCurrent(getState, datasetRevision, signal)
      const aggregation = network.derivation
      if (aggregation?.type !== 'aggregation') continue

      const baseNetwork = datasetContent.networkIndex[aggregation.baseNetworkId]
      if (!baseNetwork || baseNetwork.derivation?.type === 'aggregation') {
        skippedNetworkIds.push(network.id)
        continue
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
        continue
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
    }

    return fulfillWithValue({ networks, skippedNetworkIds }, { datasetRevision })
  },
)
