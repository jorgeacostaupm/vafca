import { useAtlasDefinition } from '@/hooks/useAtlasDefinition'
import { useAppSelector } from '@/store/hooks'
import { selectAtlasPresentation } from '@/store/slices/atlasUi/atlasPresentationSelectors'

export const useAtlasLabelPresentation = ({ useMatrixHierarchyOrder = false } = {}) => {
  const atlasId = useAppSelector(state => state.dataset.nodeSet?.id)
  useAtlasDefinition(atlasId)
  return useAppSelector(state => selectAtlasPresentation(state, useMatrixHierarchyOrder))
}
