import type { AtlasNode } from '@/types/atlas';

export function roiTooltip(node: AtlasNode | undefined, id: string) {
  if (!node) return id;
  return [node.name, node.id, ...Object.entries(node.metadata ?? {})
    .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    .map(([key, value]) => `${key}: ${value}`)].join('\n');
}
