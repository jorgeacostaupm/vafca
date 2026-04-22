import type { RootState } from '@/types/store'

export const selectAtlasState = (state: RootState) => state.atlas
export const selectAtlasOrder = (state: RootState) => state.atlas.order
export const selectAtlasLabelsById = (state: RootState) => state.atlas.labelsById
export const selectAtlasColorFields = (state: RootState) => state.atlas.colorFields
export const selectAtlasColorPalette = (state: RootState) => state.atlas.colorPalette
