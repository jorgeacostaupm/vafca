import { createSelector } from '@reduxjs/toolkit'

import { selectAtlasEnabledIds } from '@/store/slices/atlasUi/atlasUiSelectors'
import { selectDatasetContent } from '@/store/slices/dataset/datasetSelectors'
import { selectActiveNetworkEdgeMask } from '@/store/slices/networkFilters/networkFiltersSelectors'
import type { RootState } from '@/types/store'

export const selectRankingInputs = createSelector(
  [selectDatasetContent, selectAtlasEnabledIds, selectActiveNetworkEdgeMask],
  (datasetContent, activeNodeIds, edgeMask) => ({ datasetContent, activeNodeIds, edgeMask }),
)

export const rankingInputsChanged = (current: RootState, previous: RootState) =>
  selectRankingInputs(current) !== selectRankingInputs(previous)
