import type { RootState } from '@/types/store'
import {
  getAtlasDisplayLabel,
  getAtlasSearchText,
  isAtlasLabelEnabled,
} from '@/utils/atlas/labels'

export const selectAtlasState = (state: RootState) => state.atlas
export const selectAtlasOrder = (state: RootState) => state.atlas.order
export const selectAtlasLabelsById = (state: RootState) => state.atlas.labelsById
export const selectAtlasColorFields = (state: RootState) => state.atlas.colorFields
export const selectAtlasColorPalette = (state: RootState) => state.atlas.colorPalette

export const selectAtlasEnabledById = (state: RootState) =>
  Object.fromEntries(
    state.atlas.order.map((id) => [
      id,
      isAtlasLabelEnabled(state.atlas.labelsById[id]),
    ]),
  ) as Record<string, boolean>

export const selectAtlasEnabledIds = (state: RootState) =>
  state.atlas.order.filter((id) => isAtlasLabelEnabled(state.atlas.labelsById[id]))

export const selectAtlasDisplayLabelsById = (state: RootState) =>
  Object.fromEntries(
    state.atlas.order.map((id) => [
      id,
      getAtlasDisplayLabel(state.atlas.labelsById[id], id),
    ]),
  ) as Record<string, string>

export const selectAtlasLabelSearchTextById = (state: RootState) =>
  Object.fromEntries(
    state.atlas.order.map((id) => [
      id,
      getAtlasSearchText(state.atlas.labelsById[id], id),
    ]),
  ) as Record<string, string>
