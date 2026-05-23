import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AtlasLabel, AtlasState } from '@/types/atlas'
import type { MatrixOrderEntry } from '@/types/matrixOrder'
import { DEFAULT_D3_GROUPING_PALETTE } from '@/config/groupingPalettes'
import {
  type AtlasColorPalettePayload,
  initialAtlasState,
  type SetAtlasLabelsPayload,
} from './atlasTypes'

const atlasSlice = createSlice({
  name: 'atlas',
  initialState: initialAtlasState,
  reducers: {
    setAtlasLabels(state, action: PayloadAction<SetAtlasLabelsPayload>) {
      state.order = action.payload.order
      state.labelsById = action.payload.labelsById
      state.initialized = true
    },
    setLabelEnabled(
      state,
      action: PayloadAction<{ id: string; enabled: boolean }>,
    ) {
      const label = state.labelsById[action.payload.id]
      if (!label) return
      label.enabled = action.payload.enabled
    },
    setLabelsEnabled(
      state,
      action: PayloadAction<{ ids: string[]; enabled: boolean }>,
    ) {
      const { ids, enabled } = action.payload
      for (const id of ids) {
        const label = state.labelsById[id]
        if (label) label.enabled = enabled
      }
    },
    setAllLabels(state, action: PayloadAction<boolean>) {
      const enabled = action.payload
      for (const id of state.order) {
        const label = state.labelsById[id]
        if (label) label.enabled = enabled
      }
    },
    setAtlasColorFields(state, action: PayloadAction<string[]>) {
      state.colorFields = action.payload
    },
    setAtlasColorPalette(state, action: PayloadAction<AtlasColorPalettePayload>) {
      state.colorPalette = action.payload
    },
    setCircularHierarchyFields(state, action: PayloadAction<string[]>) {
      state.circularHierarchyFields = action.payload
    },
    setCircularHierarchyCategoryOrder(
      state,
      action: PayloadAction<Record<string, string[]>>,
    ) {
      state.circularHierarchyCategoryOrder = action.payload
    },
    setMatrixHierarchyFields(state, action: PayloadAction<string[]>) {
      state.matrixHierarchyFields = action.payload
    },
    setMatrixHierarchyCategoryOrder(
      state,
      action: PayloadAction<Record<string, string[]>>,
    ) {
      state.matrixHierarchyCategoryOrder = action.payload
    },
  },
})

export const {
  setAtlasLabels,
  setLabelEnabled,
  setLabelsEnabled,
  setAllLabels,
  setAtlasColorFields,
  setAtlasColorPalette,
  setCircularHierarchyFields,
  setCircularHierarchyCategoryOrder,
  setMatrixHierarchyFields,
  setMatrixHierarchyCategoryOrder,
} = atlasSlice.actions

export const buildAtlasState = (
  items: MatrixOrderEntry[],
  previous?: AtlasState,
): AtlasState => {
  const order = items.map((item) => item.id)
  const baseEnabledMap = previous?.initialized
    ? Object.fromEntries(
        Object.entries(previous.labelsById).map(([id, value]) => [
          id,
          value.enabled,
        ]),
      )
    : null

  const labelsById = items.reduce<Record<string, AtlasLabel>>((acc, item) => {
    const enabled =
      baseEnabledMap && item.id in baseEnabledMap
        ? Boolean(baseEnabledMap[item.id])
        : baseEnabledMap
          ? false
          : true
    acc[item.id] = {
      id: item.id,
      label: item.label,
      acronym: item.acronym,
      enabled,
    }
    return acc
  }, {})

  return {
    order,
    labelsById,
    initialized: true,
    colorFields: previous?.colorFields ?? [],
    colorPalette: previous?.colorPalette ?? DEFAULT_D3_GROUPING_PALETTE,
    circularHierarchyFields: previous?.circularHierarchyFields ?? [],
    circularHierarchyCategoryOrder: previous?.circularHierarchyCategoryOrder ?? {},
    matrixHierarchyFields: previous?.matrixHierarchyFields ?? [],
    matrixHierarchyCategoryOrder: previous?.matrixHierarchyCategoryOrder ?? {},
  }
}

export default atlasSlice.reducer
