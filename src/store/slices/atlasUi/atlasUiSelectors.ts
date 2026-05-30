import type { RootState } from '@/types/store'
import {
  getAtlasDisplayLabel,
  getAtlasSearchText,
  isAtlasLabelEnabled,
} from '@/utils/atlas/labels'

export const selectAtlasUiState = (state: RootState) => state.atlasUi
export const selectAtlasOrder = (state: RootState) => state.atlasUi.order
export const selectAtlasLabelsById = (state: RootState) => state.atlasUi.labelsById
export const selectAtlasColorFields = (state: RootState) => state.atlasUi.colorFields
export const selectAtlasColorPalette = (state: RootState) => state.atlasUi.colorPalette

export const selectAtlasEnabledById = (state: RootState) =>
  Object.fromEntries(
    state.atlasUi.order.map((id) => [
      id,
      isAtlasLabelEnabled(state.atlasUi.labelsById[id]),
    ]),
  ) as Record<string, boolean>

export const selectAtlasEnabledIds = (state: RootState) =>
  state.atlasUi.order.filter((id) => isAtlasLabelEnabled(state.atlasUi.labelsById[id]))

export const selectAtlasDisplayLabelsById = (state: RootState) =>
  Object.fromEntries(
    state.atlasUi.order.map((id) => [
      id,
      getAtlasDisplayLabel(state.atlasUi.labelsById[id], id),
    ]),
  ) as Record<string, string>

export const selectAtlasLabelSearchTextById = (state: RootState) =>
  Object.fromEntries(
    state.atlasUi.order.map((id) => [
      id,
      getAtlasSearchText(state.atlasUi.labelsById[id], id),
    ]),
  ) as Record<string, string>
