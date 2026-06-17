import { createAsyncThunk } from '@reduxjs/toolkit'

import type { DatasetNetworkSummary } from '@/types/datasetNetworkView'
import type { RootState } from '@/types/store'

import { patchNetworkControls } from '../networkVisualizationSlice'

export const syncNetworkSelectedCompoundId = createAsyncThunk<
  void,
  { matches: DatasetNetworkSummary[] },
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
