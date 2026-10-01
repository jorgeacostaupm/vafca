import type { AtlasDefinition } from '@/types/atlas'
import { buildCircularHierarchyLayout } from '@/utils/circular/hierarchy'

export const orderAtlasLabels = (
  labelIds: string[], atlasDefinition: AtlasDefinition | null | undefined,
  fields: string[], categoryOrder: Record<string, string[]>,
) => {
  if (!fields.length || !atlasDefinition?.nodes.length) return labelIds
  return buildCircularHierarchyLayout({ labelIds, atlasDefinition, hierarchyFields: fields, categoryOrder, radius: 1 })
    .sort((a, b) => a.order - b.order).map(point => point.labelId)
}
