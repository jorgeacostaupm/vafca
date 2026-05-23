import type {
  AtlasLabel,
  AtlasState,
} from '@/types/atlas'
import {
  DEFAULT_D3_GROUPING_PALETTE,
  type D3GroupingPaletteKey,
} from '@/config/groupingPalettes'

export type AtlasSliceState = AtlasState

export type SetAtlasLabelsPayload = {
  order: string[]
  labelsById: Record<string, AtlasLabel>
}

export const initialAtlasState: AtlasSliceState = {
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
