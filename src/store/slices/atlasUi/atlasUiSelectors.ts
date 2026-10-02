import { createSelector } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'

import type { RootState } from '@/types/store'
import {
  getAtlasDisplayLabel,
  getAtlasSearchText,
  isAtlasLabelEnabled,
} from '@/utils/atlas/labels'

export const selectAtlasOrder = (state: RootState) => state.atlasUi.order
export const selectAtlasLabelsById = (state: RootState) => state.atlasUi.labelsById
export const selectAtlasColorFields = (state: RootState) => state.atlasUi.colorFields
export const selectAtlasColorPalette = (state: RootState) => state.atlasUi.colorPalette

export const selectAtlasEnabledIds = createSelector(
  [selectAtlasOrder, selectAtlasLabelsById],
  (order, labelsById) => order.filter((id) => isAtlasLabelEnabled(labelsById[id])),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } },
)

export const selectAtlasDisplayLabelsById = createSelector(
  [selectAtlasOrder, selectAtlasLabelsById],
  (order, labelsById) =>
    Object.fromEntries(
      order.map((id) => [
        id,
        getAtlasDisplayLabel(labelsById[id], id),
      ]),
    ) as Record<string, string>,
)

export const selectAtlasLabelSearchTextById = createSelector(
  [selectAtlasOrder, selectAtlasLabelsById],
  (order, labelsById) =>
    Object.fromEntries(
      order.map((id) => [
        id,
        getAtlasSearchText(labelsById[id], id),
      ]),
    ) as Record<string, string>,
)
