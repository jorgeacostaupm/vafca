import type {
  AtlasLabel,
  AtlasState,
  D3CategoricalPaletteKey,
} from '@/types/atlas'
import { DEFAULT_D3_CATEGORICAL_PALETTE } from '@/utils/atlas/coloring'

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
  colorPalette: DEFAULT_D3_CATEGORICAL_PALETTE,
  circularHierarchyFields: [],
  circularHierarchyCategoryOrder: {},
  matrixHierarchyFields: [],
  matrixHierarchyCategoryOrder: {},
}

export type AtlasColorPalettePayload = D3CategoricalPaletteKey
