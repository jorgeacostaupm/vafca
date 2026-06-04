import { createAsyncThunk } from '@reduxjs/toolkit'

import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlasUi'
import type { RootState } from '@/types/store'
import {
  getDatasetAtlasId,
  getDatasetMatrixOrder,
} from '@/utils/datasetAccessors'
import { normalizeMatrixOrder } from '@/utils/matrixOrder'

import { selectDatasetData } from '../datasetSelectors'
import {
  buildAtlasOrder,
  resolveAtlasDefinition,
} from '../utils/atlasDerivedState'

export const syncDatasetDerivedState = createAsyncThunk<
  void,
  void,
  { state: RootState }
>('dataset/syncDatasetDerivedState', async (_, { dispatch, getState }) => {
  const state = getState()
  const data = selectDatasetData(state)
  if (!data) return

  const matrixOrder = normalizeMatrixOrder(getDatasetMatrixOrder(data))
  if (matrixOrder.length === 0) return

  const atlasId = getDatasetAtlasId(data)
  const atlasDefinition = resolveAtlasDefinition(state, atlasId)
  const atlasOrder = buildAtlasOrder(matrixOrder, atlasDefinition)
  dispatch(setAtlasLabels(buildAtlasState(atlasOrder, state.atlasUi)))
})
