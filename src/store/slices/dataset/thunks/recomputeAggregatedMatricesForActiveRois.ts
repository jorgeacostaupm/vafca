import { createAsyncThunk } from '@reduxjs/toolkit'

import {
  type AggregatedMatrixOrderMode,
  buildRoiGroupsFromTags,
  computeAggregatedMatrix,
  createAggregatedMatrix,
  hashGroupOrder,
  hashRoiSet,
} from '@/networkDerivation/aggregation/roiGroupAggregation'
import type { ConnectivityMatrix } from '@/types/connectivityBundle'
import type { RootState } from '@/types/store'

import { selectDatasetContent } from '../datasetSelectors'

export type RecomputeAggregatedMatricesForActiveRoisResult = {
  matrices: ConnectivityMatrix[]
  skippedMatrixIds: string[]
}

export const recomputeAggregatedMatricesForActiveRois = createAsyncThunk<
  RecomputeAggregatedMatricesForActiveRoisResult,
  void,
  { state: RootState; rejectValue: string }
>(
  'dataset/recomputeAggregatedMatricesForActiveRois',
  async (_, { getState, rejectWithValue }) => {
    const state = getState()
    const datasetContent = selectDatasetContent(state)
    if (!datasetContent) return rejectWithValue('No dataset is loaded.')

    const activeRoiIds = state.atlasUi.order.filter(
      (id) => state.atlasUi.labelsById[id]?.enabled !== false,
    )
    const activeRoiSet = new Set(activeRoiIds)
    const activeRoiSetHash = hashRoiSet(activeRoiIds)
    const aggregatedMatrices = datasetContent.matrices.filter(
      (matrix) => matrix.kind === 'aggregated' && matrix.aggregation,
    )

    const matrices: ConnectivityMatrix[] = []
    const skippedMatrixIds: string[] = []

    aggregatedMatrices.forEach((matrix) => {
      const aggregation = matrix.aggregation
      if (!aggregation) return

      const baseMatrix = datasetContent.matrixIndex[aggregation.baseMatrixId]
      if (!baseMatrix || baseMatrix.kind === 'aggregated') {
        skippedMatrixIds.push(matrix.id)
        return
      }

      const orderMode =
        (aggregation.parameters.orderMode as AggregatedMatrixOrderMode | undefined) ??
        'matrix'
      const categoryOrder =
        orderMode === 'circular'
          ? state.atlasUi.circularHierarchyCategoryOrder
          : state.atlasUi.matrixHierarchyCategoryOrder
      const missingTagPolicy =
        aggregation.parameters.missingTagPolicy ?? 'unknown_group'

      const groupResult = buildRoiGroupsFromTags({
        atlas: datasetContent.atlas,
        fields: aggregation.fields,
        categoryOrder,
        activeRoiIds: activeRoiSet,
        missingTagPolicy,
      })

      if (groupResult.groups.length < 2) {
        skippedMatrixIds.push(matrix.id)
        return
      }

      const groupOrderHash = hashGroupOrder(
        groupResult.groups.map((group) => group.id),
      )
      const computed = computeAggregatedMatrix({
        baseMatrix,
        atlas: datasetContent.atlas,
        groups: groupResult.groups,
      })
      const nextMatrix = createAggregatedMatrix({
        baseMatrix,
        atlas: datasetContent.atlas,
        groups: groupResult.groups,
        data: computed.data,
        cellCounts: computed.cellCounts,
        fields: aggregation.fields,
        excludedRoiIds: groupResult.excludedRoiIds,
        activeRoiIds,
        activeRoiSetHash,
        groupOrderHash,
        orderMode,
        missingTagPolicy,
      })

      matrices.push({
        ...nextMatrix,
        id: matrix.id,
        label: matrix.label,
        context: {
          ...nextMatrix.context,
          layerId: matrix.context.layerId,
        },
      })
    })

    return { matrices, skippedMatrixIds }
  },
)
