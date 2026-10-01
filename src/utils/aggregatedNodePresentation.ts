import { AGGREGATED_NODE_LABEL_MAX_CHARACTERS } from '@/config/ui'
import { appColors } from '@/theme'
import type { AtlasDefinition, AtlasNode } from '@/types/atlas'
import type { NodeGroup } from '@/types/network'
import { getNodeFieldValue, normalizeNodeFieldValue } from '@/utils/atlas/atlasDefinition'

export const buildAggregatedNodeColors = (groups: NodeGroup[]) =>
  Object.fromEntries(groups.map(group => [group.id, appColors.textSecondary]))

export const buildAggregatedAtlasNodes = (
  groups: NodeGroup[], atlas: AtlasDefinition, fields: string[],
): AtlasNode[] => {
  const byId = new Map(atlas.nodes.map(node => [String(node.id), node]))
  return groups.map((group, index) => ({
    id: group.id, atlasId: group.id, index, name: group.label, label: group.label,
    metadata: Object.fromEntries(fields.map(field => {
      const values = new Set(group.nodeIds.map(id => {
        const node = byId.get(id)
        return node ? normalizeNodeFieldValue(getNodeFieldValue(node, field)) : 'Unknown'
      }))
      return [field, values.size === 1 ? [...values][0] : 'Mixed']
    })),
  }))
}

export const shortenAggregatedNodeLabels = (labels: Record<string, string>) =>
  Object.fromEntries(Object.entries(labels).map(([id, label]) => {
    const characters = Array.from(label)
    return [id, characters.length > AGGREGATED_NODE_LABEL_MAX_CHARACTERS
      ? characters.slice(0, AGGREGATED_NODE_LABEL_MAX_CHARACTERS - 1).join('') + '…'
      : label]
  }))

export const buildAggregatedGroupLabels = (groups: NodeGroup[], labels: Record<string, string>) => {
  const labelNames = Object.fromEntries(groups.map((group, index) => [
    group.id, labels[group.id]?.trim() || `G${index + 1}`,
  ]))
  const labelTitles = Object.fromEntries(groups.map(group => [
    group.id, `${labelNames[group.id]} — ` + Object.entries(group.criteria)
      .map(([field, value]) => `${field}: ${value ?? 'Unknown'}`).join(' / '),
  ]))
  return { labelNames, labelAcronyms: { ...labelNames }, labelTitles }
}
