import { createAsyncThunk } from '@reduxjs/toolkit'

import { DEFAULT_NETWORK_PANEL_LAYOUT } from '@/config/ui'
import {
  buildNodeGroupsFromMetadata,
  computeAggregatedVisibleNetworkData,
  getCurrentVisualizationGrouping,
} from '@/networkDerivation/aggregation/nodeGroupAggregation'
import { selectDatasetContent } from '@/store/slices/dataset'
import { yieldToBrowser } from '@/store/slices/dataset/utils/browserYield'
import { addNetworkLayoutItem } from '@/store/slices/networkLayout'
import type { NetworkViewType } from '@/types/networkVisualization'
import type { AppDispatch, RootState } from '@/types/store'
import { buildAggregatedGroupLabels, buildAggregatedNodeColors } from '@/utils/aggregatedNodePresentation'
import { computeNetworkMatrixDataStats } from '@/utils/networkDataStats'

import {
  addTemporaryAggregatedNetworkView,
  setNetworkViewStatus,
  setTemporaryAggregatedNetwork,
} from '../networkVisualizationSlice'

export type VisibleNetworkSnapshot = {
  data: number[][]
  rowLabels: string[]
  colLabels: string[]
  symmetric: boolean
}

export type AggregateNetworkViewRequest = {
  sourceViewId: string
  sourceNetworkId: string
  sourceViewType: NetworkViewType
  fields: string[]
  groupLabels?: Record<string, string>
  snapshot: VisibleNetworkSnapshot
}

const labelsMatch = (left: string[], right: string[]) =>
  left.length === right.length && left.every((label, index) => label === right[index])

export const aggregateNetworkView = createAsyncThunk<
  { viewId: string; temporaryNetworkId: string },
  AggregateNetworkViewRequest,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  'networkVisualization/aggregateNetworkView',
  async (
    { sourceViewId, sourceNetworkId, snapshot, fields, groupLabels = {} },
    { dispatch, getState, rejectWithValue },
  ) => {
    const state = getState()
    const datasetContent = selectDatasetContent(state)
    if (!datasetContent) return rejectWithValue('No dataset is loaded.')

    const sourceView = state.networkVisualization.viewsById[sourceViewId]
    if (!sourceView) return rejectWithValue('Source view not found.')
    if (sourceView.temporaryNetworkId) {
      return rejectWithValue('Aggregated networks cannot be aggregated again.')
    }

    const sourceNetwork = datasetContent.networkIndex[sourceNetworkId]
    if (!sourceNetwork) return rejectWithValue('Source network not found in dataset.')

    if (sourceNetwork.derivation?.type === 'aggregation') {
      return rejectWithValue('Aggregated networks cannot be aggregated again.')
    }

    const grouping = getCurrentVisualizationGrouping(fields, {})
    if (!grouping) return rejectWithValue('Select at least one aggregation field.')

    const visibleNodeIds = Array.from(new Set([...snapshot.rowLabels, ...snapshot.colLabels]))
    if (visibleNodeIds.length === 0) {
      return rejectWithValue('No visible nodes are available to aggregate.')
    }

    const missingFields = grouping.fields.filter(
      (field) => !datasetContent.nodeSet.nodes.some((node) => field in (node.metadata ?? {})),
    )
    if (missingFields.length > 0) {
      return rejectWithValue(`Selected metadata field does not exist: ${missingFields.join(', ')}.`)
    }

    const groupResult = buildNodeGroupsFromMetadata({
      nodeSet: datasetContent.nodeSet,
      fields: grouping.fields,
      categoryOrder: grouping.categoryOrder,
      activeNodeIds: new Set(visibleNodeIds),
      missingTagPolicy: grouping.missingTagPolicy,
    })
    if (groupResult.groups.length < 2) {
      return rejectWithValue('Not enough visible node groups to compute an aggregated network.')
    }

    if (groupResult.groups.some(group =>
      groupLabels[group.id] !== undefined && typeof groupLabels[group.id] !== 'string',
    )) return rejectWithValue('Group labels must be text.')

    const nextViewSeq = state.networkVisualization.nextViewSeq
    const viewId = `temporary-aggregation::${nextViewSeq}`
    const temporaryNetworkId = `${viewId}::network`
    const label = `${sourceView.label} aggregated`
    dispatch(
      addTemporaryAggregatedNetworkView({
        viewId,
        temporaryNetworkId,
        type: sourceView.type,
        label,
        measureId: sourceView.measureId,
        statisticId: sourceView.statisticId,
        loadingMessage: 'Aggregating network...',
      }),
    )
    dispatch(
      addNetworkLayoutItem({
        viewId,
        defaultW: DEFAULT_NETWORK_PANEL_LAYOUT.width,
        defaultH: DEFAULT_NETWORK_PANEL_LAYOUT.height,
        initialX: DEFAULT_NETWORK_PANEL_LAYOUT.initialX,
        initialY: DEFAULT_NETWORK_PANEL_LAYOUT.initialY,
      }),
    )

    await yieldToBrowser()

    try {
      const result = computeAggregatedVisibleNetworkData({
        data: snapshot.data,
        rowLabels: snapshot.rowLabels,
        colLabels: snapshot.colLabels,
        groups: groupResult.groups,
        symmetric: snapshot.symmetric,
      })
      const symmetric = snapshot.symmetric && labelsMatch(snapshot.rowLabels, snapshot.colLabels)
      const data = result.data.map((row) =>
        row.map((value) => (typeof value === 'number' && Number.isFinite(value) ? value : NaN)),
      )

      dispatch(
        setTemporaryAggregatedNetwork({
          viewId,
          network: {
            id: temporaryNetworkId,
            sourceViewId,
            sourceNetworkLabel: sourceView.label,
            label,
            measureId: sourceView.measureId,
            statisticId: sourceView.statisticId,
            data,
            rowLabels: result.labels,
            colLabels: result.labels,
            symmetric,
            groups: result.groups,
            ...buildAggregatedGroupLabels(result.groups, groupLabels),
            nodeColors: buildAggregatedNodeColors(result.groups),
            dataStats: computeNetworkMatrixDataStats(result.data),
            createdAt: new Date().toISOString(),
          },
        }),
      )
      return { viewId, temporaryNetworkId }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to aggregate network.'
      dispatch(setNetworkViewStatus({ viewId, status: 'error', error: message }))
      return rejectWithValue(message)
    }
  },
)
