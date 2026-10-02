import { createAsyncThunk } from '@reduxjs/toolkit'

import {
  type AggregatedNetworkOrderMode,
  buildNodeGroupsFromMetadata,
  computeAggregatedNetworkData,
  createAggregatedNetwork,
  findEquivalentAggregatedNetwork,
  getCurrentVisualizationGrouping,
  hashGroupOrder,
  hashNodeSet,
} from '@/networkDerivation/aggregation/nodeGroupAggregation'
import type { Network } from '@/types/network'

import { selectDatasetContent } from '../datasetSelectors'
import { yieldToBrowser } from '../utils/browserYield'
import { assertCalculationCurrent, type DatasetCalculationConfig } from '../utils/calculationSnapshot'

export type ComputeAggregatedNetworkRequest = {
  baseNetworkIds: string[]
  orderMode: AggregatedNetworkOrderMode
}

export type ComputeAggregatedNetworkResult = {
  networks: Network[]
  existing: Network[]
  warnings: string[]
}

export const computeAggregatedNetworkFromVisualizationGroups = createAsyncThunk<
  ComputeAggregatedNetworkResult,
  ComputeAggregatedNetworkRequest,
  DatasetCalculationConfig
>(
  'dataset/computeAggregatedNetworkFromVisualizationGroups',
  async ({ baseNetworkIds, orderMode }, { getState, rejectWithValue, fulfillWithValue, signal }) => {
    const state = getState()
    const datasetRevision = state.dataset.revision
    const datasetContent = selectDatasetContent(state)
    if (!datasetContent) return rejectWithValue('No dataset is loaded.')

    const uniqueBaseNetworkIds = Array.from(new Set(baseNetworkIds.filter(Boolean)))
    if (uniqueBaseNetworkIds.length === 0) {
      return rejectWithValue('No base network selected.')
    }

    const baseNetworks = uniqueBaseNetworkIds.map((id) => datasetContent.networkIndex[id])
    if (baseNetworks.some((network) => !network)) {
      return rejectWithValue('One or more selected base networks are not available.')
    }
    if (baseNetworks.some((network) => network.derivation?.type === 'aggregation')) {
      return rejectWithValue(
        'Esta red ya está agregada por grupos. Selecciona una red de nodos original como base.',
      )
    }

    const grouping = getCurrentVisualizationGrouping(
      state.atlasUi.aggregationFields,
      {},
    )
    if (!grouping) return rejectWithValue('No active metadata grouping found.')

    const activeNodeIds = state.atlasUi.order.filter(
      (id) => state.atlasUi.labelsById[id]?.enabled !== false,
    )
    const activeNodeSet = new Set(activeNodeIds)
    const activeNodeSetHash = hashNodeSet(activeNodeIds)

    const missingFields = grouping.fields.filter(
      (field) => !datasetContent.nodeSet.nodes.some((node) => field in (node.metadata ?? {})),
    )
    if (missingFields.length > 0) {
      return rejectWithValue(`Selected metadata field does not exist: ${missingFields.join(', ')}.`)
    }

    await yieldToBrowser()
    assertCalculationCurrent(getState, datasetRevision, signal)
    const groupResult = buildNodeGroupsFromMetadata({
      nodeSet: datasetContent.nodeSet,
      fields: grouping.fields,
      categoryOrder: grouping.categoryOrder,
      activeNodeIds: activeNodeSet,
      missingTagPolicy: grouping.missingTagPolicy,
    })

    if (groupResult.groups.length < 2) {
      return rejectWithValue('Not enough active node groups to compute an aggregated network.')
    }
    const groupOrderHash = hashGroupOrder(groupResult.groups.map((group) => group.id))

    const networks: Network[] = []
    const existing: Network[] = []

    for (const baseNetwork of baseNetworks) {
      await yieldToBrowser()
      assertCalculationCurrent(getState, datasetRevision, signal)
      const equivalent = findEquivalentAggregatedNetwork(datasetContent.networks, {
        baseNetworkId: baseNetwork.id,
        fields: grouping.fields,
        activeNodeSetHash,
        groupOrderHash,
        missingTagPolicy: grouping.missingTagPolicy,
        sourceNodeSetId: datasetContent.nodeSet.id,
      })
      if (equivalent) {
        existing.push(equivalent)
        continue
      }

      const computed = computeAggregatedNetworkData({
        baseNetwork,
        nodeSet: datasetContent.nodeSet,
        groups: groupResult.groups,
      })
      networks.push(
        createAggregatedNetwork({
          baseNetwork,
          nodeSet: datasetContent.nodeSet,
          groups: groupResult.groups,
          data: computed.data,
          cellCounts: computed.cellCounts,
          fields: grouping.fields,
          excludedNodeIds: groupResult.excludedNodeIds,
          activeNodeIds,
          activeNodeSetHash,
          groupOrderHash,
          orderMode,
          missingTagPolicy: grouping.missingTagPolicy,
        }),
      )
    }

    const warnings = [
      groupResult.missingTagNodeIds.length > 0
        ? 'Some active nodes do not have the selected metadata field and were assigned to Unknown.'
        : null,
      groupResult.excludedNodeIds.length > 0
        ? 'Inactive nodes are excluded from the aggregation.'
        : null,
      'This operation summarizes node-to-node values; it does not recompute PLV from source time series.',
    ].filter((message): message is string => message !== null)

    return fulfillWithValue({ networks, existing, warnings }, { datasetRevision })
  },
)
