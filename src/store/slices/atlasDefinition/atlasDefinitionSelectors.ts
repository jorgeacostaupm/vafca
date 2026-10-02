import type { RootState } from '@/types/store'

export const selectUploadedAtlas = (state: RootState) => state.atlasDefinition.uploaded
export const selectDefaultAtlasDefinitionById = (
  state: RootState,
  atlasId?: string,
) => {
  if (!atlasId) return null
  return state.atlasDefinition.defaultById[atlasId] ?? null
}
