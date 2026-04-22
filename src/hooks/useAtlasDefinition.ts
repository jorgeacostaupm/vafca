import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  ensureDefaultAtlasDefinitionLoaded,
  selectDefaultAtlasDefinitionById,
  selectUploadedAtlas,
} from '@/store/slices/atlasDefinition'

export const useAtlasDefinition = (atlasId?: string) => {
  const dispatch = useAppDispatch()
  const uploadedAtlas = useAppSelector(selectUploadedAtlas)
  const defaultAtlasDefinition = useAppSelector((state) =>
    selectDefaultAtlasDefinitionById(state, atlasId),
  )

  useEffect(() => {
    if (!atlasId) return
    void dispatch(ensureDefaultAtlasDefinitionLoaded({ atlasId }))
  }, [atlasId, dispatch])

  if (uploadedAtlas?.atlas) {
    return uploadedAtlas.atlas
  }
  return defaultAtlasDefinition ?? null
}
