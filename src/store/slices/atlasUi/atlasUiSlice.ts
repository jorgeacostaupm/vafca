import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { DEFAULT_D3_GROUPING_PALETTE } from '@/config/groupingPalettes'
import { updateRoiMetadata } from '@/store/actions/updateRoiMetadata'
import type { AtlasLabel, AtlasState } from '@/types/atlas'
import type { NodeOrderEntry } from '@/types/nodeOrder'

import {
  type AtlasColorPalettePayload,
  initialAtlasUiState,
  type SetAtlasLabelsPayload,
} from './atlasUiTypes'

const atlasUiSlice = createSlice({
  name: 'atlasUi',
  initialState: initialAtlasUiState,
  extraReducers: (builder) => {
    builder.addCase(updateRoiMetadata, (state, { payload }) => {
      const label = state.labelsById[payload.id]
      if (label) label.metadata = payload.metadata
    })
  },
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
    setLabelsEnabledMap(
      state,
      action: PayloadAction<Record<string, boolean>>,
    ) {
      for (const id of state.order) {
        const label = state.labelsById[id]
        const enabled = action.payload[id]
        if (label && typeof enabled === 'boolean') label.enabled = enabled
      }
    },
    setAllLabels(state, action: PayloadAction<boolean>) {
      const enabled = action.payload
      for (const id of state.order) {
        const label = state.labelsById[id]
        if (label) label.enabled = enabled
      }
    },
    setAggregationFields(state, action: PayloadAction<string[]>) {
      state.aggregationFields = action.payload
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
  setLabelsEnabledMap,
  setLabelsEnabled,
  setAllLabels,
  setAtlasColorFields,
  setAggregationFields,
  setAtlasColorPalette,
  setCircularHierarchyFields,
  setCircularHierarchyCategoryOrder,
  setMatrixHierarchyFields,
  setMatrixHierarchyCategoryOrder,
} = atlasUiSlice.actions

export const buildAtlasState = (
  items: NodeOrderEntry[],
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
      name: item.name,
      acronym: item.acronym,

      metadata: item.metadata,
      enabled,
    }
    return acc
  }, {})

  return {
    order,
    labelsById,
    initialized: true,
    colorFields: previous?.colorFields ?? [],
    aggregationFields: previous?.aggregationFields ?? [],
    colorPalette: previous?.colorPalette ?? DEFAULT_D3_GROUPING_PALETTE,
    circularHierarchyFields: previous?.circularHierarchyFields ?? [],
    circularHierarchyCategoryOrder: previous?.circularHierarchyCategoryOrder ?? {},
    matrixHierarchyFields: previous?.matrixHierarchyFields ?? [],
    matrixHierarchyCategoryOrder: previous?.matrixHierarchyCategoryOrder ?? {},
  }
}

export default atlasUiSlice.reducer
