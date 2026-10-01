import type { AtlasNode } from '../../types/atlas';

export function filterLinksAtlas<T extends { rowId: string; colId: string }>(
  links: T[], nodes: AtlasNode[], roi: string | undefined,
  field: string | undefined, module: string | undefined,
): T[] {
  const ids = new Map(nodes.flatMap(node => [[String(node.id), node], [String(node.atlasId), node]] as const));
  const inModule = (id: string) => {
    const node = ids.get(id);
    const value = field ? node?.metadata?.[field] : undefined;
    return value != null && String(value) === module;
  };
  return links.filter(link =>
    (!roi || ids.get(link.rowId)?.id === roi || ids.get(link.colId)?.id === roi) &&
    (module === undefined || (inModule(link.rowId) && inModule(link.colId))),
  );
}
