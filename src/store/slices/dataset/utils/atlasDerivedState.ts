import type { AtlasDefinition } from '@/types/atlas'
import type { NodeOrderEntry } from '@/types/nodeOrder'
import type { RootState } from '@/types/store'

export const buildAtlasOrder = (
  nodeOrder: NodeOrderEntry[],
  atlasDefinition: AtlasDefinition | null,
) => {
  if (nodeOrder.length === 0) return []
  if (!atlasDefinition?.nodes?.length) return nodeOrder

  const nodeById = new Map(
    atlasDefinition.nodes.flatMap((node) => [
      [String(node.id), node] as const,
      [String(node.atlasId), node] as const,
    ]),
  )
  return nodeOrder.map((entry) => {
    const node = nodeById.get(entry.id)
    if (!node) return entry
    return {
      ...entry,
      name: node.name ?? entry.name ?? entry.label,
      label: node.name ?? entry.label,
      acronym: node.label ?? entry.label,

      metadata: node.metadata,
    }
  })
}

export const resolveAtlasDefinition = (state: RootState, atlasId?: string) => {
  if (state.atlasDefinition.uploaded?.atlas) {
    return state.atlasDefinition.uploaded.atlas
  }
  if (!atlasId) return null
  return state.atlasDefinition.defaultById[atlasId] ?? null
}
