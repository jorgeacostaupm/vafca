import type { RootState } from '@/types/store'

export const selectAtlasDefinitionState = (state: RootState) => state.atlasDefinition
export const selectUploadedAtlas = (state: RootState) => state.atlasDefinition.uploaded
export const selectUploadedAtlasStatus = (state: RootState) =>
  state.atlasDefinition.uploadStatus
export const selectUploadedAtlasError = (state: RootState) =>
  state.atlasDefinition.uploadError
export const selectDefaultAtlasDefinitionById = (
  state: RootState,
  atlasId?: string,
) => {
  if (!atlasId) return null
  return state.atlasDefinition.defaultById[atlasId] ?? null
}
export const selectDefaultAtlasDefinitionStatusById = (
  state: RootState,
  atlasId?: string,
) => {
  if (!atlasId) return 'idle'
  return state.atlasDefinition.defaultStatusById[atlasId] ?? 'idle'
}
export const selectDefaultAtlasDefinitionErrorById = (
  state: RootState,
  atlasId?: string,
) => {
  if (!atlasId) return null
  return state.atlasDefinition.defaultErrorById[atlasId] ?? null
}
