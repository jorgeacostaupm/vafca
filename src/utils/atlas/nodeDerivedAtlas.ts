import type { AtlasDefinition, AtlasNode, AtlasSource } from "@/types/atlas";
import type { NodeSet } from "@/types/network";
import type { NodeOrderEntry, NodeOrderItem } from "@/types/nodeOrder";
import { normalizeNodeOrder } from "@/utils/nodeOrder";

export const NODE_DERIVED_ATLAS_ID = "__node_derived_atlas__";

const NODE_ORDER_LABEL_FIELDS = new Set(["id", "label", "name", "value", "acronym"]);

const isNodeOrderObject = (
  item: NodeOrderItem | NodeOrderEntry,
): item is Record<string, unknown> =>
  typeof item === "object" && item !== null && !Array.isArray(item);

const getNodeOrderExtraFields = (
  item: NodeOrderItem | NodeOrderEntry | undefined,
) => {
  if (!item || !isNodeOrderObject(item)) return {};

  return Object.fromEntries(
    Object.entries(item).filter(([key]) => !NODE_ORDER_LABEL_FIELDS.has(key)),
  );
};

const getNodeOrderMetadata = (item: NodeOrderItem | NodeOrderEntry | undefined) => {
  const extras = getNodeOrderExtraFields(item);
  const { metadata, ...fields } = extras;
  return { ...fields, ...(metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {}) };
};

export const buildNodeDerivedAtlas = (
  nodeOrder: NodeOrderItem[] | NodeOrderEntry[],
): AtlasDefinition | null => {
  const entries = normalizeNodeOrder(nodeOrder);
  if (entries.length === 0) return null;

  return {
    id: NODE_DERIVED_ATLAS_ID,
    name: "Node-derived atlas",
    description: "Minimal atlas generated from the loaded node order.",
    nodes: entries.map<AtlasNode>((entry, index) => ({
      index,
      id: entry.id,
      atlasId: entry.id,
      label: entry.acronym ?? entry.label,
      name: entry.label,
      metadata: getNodeOrderMetadata(nodeOrder[index]),
      coords: null,
    })),
  };
};

export const buildNodeDerivedAtlasSource = (
  nodeOrder: NodeOrderItem[] | NodeOrderEntry[],
): AtlasSource | null => {
  const atlas = buildNodeDerivedAtlas(nodeOrder);
  if (!atlas) return null;

  return {
    atlas,
    fileName: "Generated from node set",
  };
};

export const buildAtlasSourceFromNodeSet = (
  nodeSet: NodeSet | undefined,
  fileName: string,
): AtlasSource | null => {
  if (!nodeSet?.nodes.length) return null;

  return {
    atlas: {
      id: nodeSet.id,
      spatial: nodeSet.spatial,
      name: nodeSet.label,
      description: nodeSet.description ?? undefined,
      version: nodeSet.version ?? undefined,
      coordinateSystem: nodeSet.coordinateSystem ?? undefined,
      nodes: [...nodeSet.nodes]
        .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
        .map<AtlasNode>((node, index) => ({
          index: node.index ?? index,
          id: node.id,
          atlasId: node.atlasId ?? node.id,
          name: node.name ?? node.label,
          label: node.label,
          coords: node.coords ?? null,
          metadata: node.metadata,
        })),
    },
    fileName,
  };
};
