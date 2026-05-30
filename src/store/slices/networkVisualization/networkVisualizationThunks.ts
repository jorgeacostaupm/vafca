import { createAsyncThunk } from '@reduxjs/toolkit'
import { DEFAULT_NETWORK_PANEL_LAYOUT } from '@/config/ui'
import type { MatrixSummary } from '@/types/matrixStore'
import type { NetworkViewType } from '@/types/networkVisualization'
import type { AppDispatch, RootState } from '@/types/store'
import { selectDatasetData } from '@/store/slices/dataset'
import {
  addNetworkLayoutItem,
  removeNetworkLayoutItem,
} from '@/store/slices/networkLayout'
import { getDatasetMatrixByCompoundId } from '@/utils/datasetAccessors'
import {
  addNetworkView,
  mutateNetworkViewTypeLocally,
  patchNetworkControls,
  removeNetworkView,
  setNetworkViewStatus,
} from './networkVisualizationSlice'
import type { NetworkViewFormattingError } from './networkVisualizationTypes'

export const markNetworkViewFormatting = createAsyncThunk<
  { viewId: string },
  { viewId: string },
  { state: RootState; rejectValue: NetworkViewFormattingError }
>(
  'networkVisualization/markNetworkViewFormatting',
  async ({ viewId }, { dispatch, getState, rejectWithValue }) => {
    dispatch(setNetworkViewStatus({ viewId, status: 'formatting' }))

    const target = getState().networkVisualization.viewsById[viewId]
    if (!target) {
      const payload = { viewId, error: 'View not found.' }
      dispatch(setNetworkViewStatus({ ...payload, status: 'error' }))
      return rejectWithValue(payload)
    }

    const matrix = getDatasetMatrixByCompoundId(
      selectDatasetData(getState()),
      target.compoundId,
    )
    if (!matrix) {
      const payload = { viewId, error: 'Matrix not found in store.' }
      dispatch(setNetworkViewStatus({ ...payload, status: 'error' }))
      return rejectWithValue(payload)
    }

    dispatch(setNetworkViewStatus({ viewId, status: 'ready' }))
    return { viewId }
  },
)

export const mutateNetworkViewType = createAsyncThunk<
  void,
  { viewId: string; nextType: NetworkViewType },
  { state: RootState; dispatch: AppDispatch }
>(
  'networkVisualization/mutateNetworkViewType',
  async ({ viewId, nextType }, { dispatch, getState }) => {
    const target = getState().networkVisualization.viewsById[viewId]
    if (!target) return
    if (target.type === nextType) return

    dispatch(mutateNetworkViewTypeLocally({ viewId, nextType }))
    await dispatch(markNetworkViewFormatting({ viewId }))
  },
)

export const addNetworkViewAndFormat = createAsyncThunk<
  { viewId: string },
  {
    type: NetworkViewType
    compoundId: string
    label: string
    measureId: string
    statId: string
  },
  { state: RootState; dispatch: AppDispatch }
>(
  'networkVisualization/addNetworkViewAndFormat',
  async ({ type, compoundId, label, measureId, statId }, { dispatch, getState }) => {
    const viewId = `${compoundId}::${getState().networkVisualization.nextViewSeq}`
    dispatch(
      addNetworkView({
        type,
        compoundId,
        label,
        measureId,
        statId,
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
    await dispatch(markNetworkViewFormatting({ viewId }))
    return { viewId }
  },
)

export const syncNetworkSelectedCompoundId = createAsyncThunk<
  void,
  { matches: MatrixSummary[] },
  { state: RootState }
>(
  'networkVisualization/syncNetworkSelectedCompoundId',
  async ({ matches }, { dispatch, getState }) => {
    const nextSelected = matches.length === 1 ? matches[0].compoundId : ''
    const selected = getState().networkVisualization.controls.selectedCompoundId
    if (nextSelected === selected) return
    dispatch(
      patchNetworkControls({
        selectedCompoundId: nextSelected,
      }),
    )
  },
)

export const pruneInvalidNetworkViews = createAsyncThunk<
  void,
  { validCompoundIds: string[]; enabled: boolean },
  { state: RootState }
>(
  'networkVisualization/pruneInvalidNetworkViews',
  async ({ validCompoundIds, enabled }, { dispatch, getState }) => {
    if (!enabled) return

    const validIds = new Set(validCompoundIds)
    const { viewsOrder, viewsById } = getState().networkVisualization
    viewsOrder.forEach((viewId) => {
      const view = viewsById[viewId]
      if (!view) return
      if (validIds.has(view.compoundId)) return
      dispatch(removeNetworkView({ viewId: view.id }))
      dispatch(removeNetworkLayoutItem({ viewId: view.id }))
    })
  },
)
