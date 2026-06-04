import { createAsyncThunk } from '@reduxjs/toolkit'

import {
  type AggregatedMatrixOrderMode,
  buildRoiGroupsFromTags,
  computeAggregatedMatrix,
  createAggregatedMatrix,
  findEquivalentAggregatedMatrix,
  getCurrentVisualizationGrouping,
  hashGroupOrder,
  hashRoiSet,
} from '@/networkDerivation/aggregation/roiGroupAggregation'
import type { ConnectivityMatrix } from '@/types/connectivityBundle'
import type { RootState } from '@/types/store'

import { selectDatasetContent } from '../datasetSelectors'
import { yieldToBrowser } from '../utils/browserYield'

export type ComputeAggregatedMatrixRequest = {
  baseMatrixIds: string[]
  orderMode: AggregatedMatrixOrderMode
}

export type ComputeAggregatedMatrixResult = {
  matrices: ConnectivityMatrix[]
  existing: ConnectivityMatrix[]
  warnings: string[]
}

export const computeAggregatedMatrixFromVisualizationGroups = createAsyncThunk<
  ComputeAggregatedMatrixResult,
  ComputeAggregatedMatrixRequest,
  { state: RootState; rejectValue: string }
>(
  'dataset/computeAggregatedMatrixFromVisualizationGroups',
  async ({ baseMatrixIds, orderMode }, { getState, rejectWithValue }) => {
    const state = getState()
    const datasetContent = selectDatasetContent(state)
    if (!datasetContent) return rejectWithValue('No dataset is loaded.')

    const uniqueBaseMatrixIds = Array.from(new Set(baseMatrixIds.filter(Boolean)))
    if (uniqueBaseMatrixIds.length === 0) {
      return rejectWithValue('No base matrix selected.')
    }

    const baseMatrices = uniqueBaseMatrixIds.map((id) => datasetContent.matrixIndex[id])
    if (baseMatrices.some((matrix) => !matrix)) {
      return rejectWithValue('One or more selected base matrices are not available.')
    }
    if (baseMatrices.some((matrix) => matrix.kind === 'aggregated')) {
      return rejectWithValue(
        'Esta matriz ya está agregada por grupos de ROIs. Selecciona una matriz ROI × ROI como base.',
      )
    }

    const categoryOrder =
      orderMode === 'circular'
        ? state.atlasUi.circularHierarchyCategoryOrder
        : state.atlasUi.matrixHierarchyCategoryOrder
    const grouping = getCurrentVisualizationGrouping(
      state.atlasUi.colorFields,
      categoryOrder,
    )
    if (!grouping) return rejectWithValue('No active tag grouping found.')

    const activeRoiIds = state.atlasUi.order.filter(
      (id) => state.atlasUi.labelsById[id]?.enabled !== false,
    )
    const activeRoiSet = new Set(activeRoiIds)
    const activeRoiSetHash = hashRoiSet(activeRoiIds)

    const missingFields = grouping.fields.filter(
      (field) => !datasetContent.atlas.rois.some((roi) => field in (roi.tags ?? {})),
    )
    if (missingFields.length > 0) {
      return rejectWithValue(`Selected tag does not exist: ${missingFields.join(', ')}.`)
    }

    await yieldToBrowser()
    const groupResult = buildRoiGroupsFromTags({
      atlas: datasetContent.atlas,
      fields: grouping.fields,
      categoryOrder: grouping.categoryOrder,
      activeRoiIds: activeRoiSet,
      missingTagPolicy: grouping.missingTagPolicy,
    })

    if (groupResult.groups.length < 2) {
      return rejectWithValue('Not enough active ROI groups to compute an aggregated matrix.')
    }
    const groupOrderHash = hashGroupOrder(groupResult.groups.map((group) => group.id))

    const matrices: ConnectivityMatrix[] = []
    const existing: ConnectivityMatrix[] = []

    baseMatrices.forEach((baseMatrix) => {
      const equivalent = findEquivalentAggregatedMatrix(datasetContent.matrices, {
        baseMatrixId: baseMatrix.id,
        fields: grouping.fields,
        activeRoiSetHash,
        groupOrderHash,
        missingTagPolicy: grouping.missingTagPolicy,
        atlasId: datasetContent.atlas.id,
      })
      if (equivalent) {
        existing.push(equivalent)
        return
      }

      const computed = computeAggregatedMatrix({
        baseMatrix,
        atlas: datasetContent.atlas,
        groups: groupResult.groups,
      })
      matrices.push(
        createAggregatedMatrix({
          baseMatrix,
          atlas: datasetContent.atlas,
          groups: groupResult.groups,
          data: computed.data,
          cellCounts: computed.cellCounts,
          fields: grouping.fields,
          excludedRoiIds: groupResult.excludedRoiIds,
          activeRoiIds,
          activeRoiSetHash,
          groupOrderHash,
          orderMode,
          missingTagPolicy: grouping.missingTagPolicy,
        }),
      )
    })

    const warnings = [
      groupResult.missingTagRoiIds.length > 0
        ? 'Some active ROIs do not have the selected tag and were assigned to Unknown.'
        : null,
      groupResult.excludedRoiIds.length > 0
        ? 'Inactive ROIs are excluded from the aggregation.'
        : null,
      'This operation summarizes ROI-to-ROI values; it does not recompute PLV from source time series.',
    ].filter((message): message is string => message !== null)

    return { matrices, existing, warnings }
  },
)
