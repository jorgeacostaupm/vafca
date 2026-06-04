import {
  type D3GroupingPaletteKey,
  DEFAULT_D3_GROUPING_PALETTE,
} from '@/config/groupingPalettes'
import type {
  AtlasLabel,
  AtlasState,
} from '@/types/atlas'

export type AtlasUiSliceState = AtlasState

export type SetAtlasLabelsPayload = {
  order: string[]
  labelsById: Record<string, AtlasLabel>
}

export const initialAtlasUiState: AtlasUiSliceState = {
  order: [],
  labelsById: {},
  initialized: false,
  colorFields: [],
  colorPalette: DEFAULT_D3_GROUPING_PALETTE,
  circularHierarchyFields: [],
  circularHierarchyCategoryOrder: {},
  matrixHierarchyFields: [],
  matrixHierarchyCategoryOrder: {},
}

export type AtlasColorPalettePayload = D3GroupingPaletteKey
