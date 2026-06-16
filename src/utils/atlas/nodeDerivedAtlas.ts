import type { AtlasDefinition, AtlasNode, AtlasSource } from "@/types/atlas";
import type { NodeOrderEntry, NodeOrderItem } from "@/types/nodeOrder";
import { normalizeNodeOrder } from "@/utils/nodeOrder";

export const NODE_DERIVED_ATLAS_ID = "__node_derived_atlas__";

export const buildNodeOrderItemsFromSize = (size: number): NodeOrderItem[] =>
  Array.from({ length: Math.max(0, size) }, (_, index) => {
    const id = String(index);
    return {
      id,
      label: `Node ${index + 1}`,
      name: `Node ${index + 1}`,
    };
  });

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

const getNodeOrderTags = (
  item: NodeOrderItem | NodeOrderEntry | undefined,
) => {
  const extras = getNodeOrderExtraFields(item);
  const flatTags = Object.fromEntries(
    Object.entries(extras).filter(
      (entry): entry is [string, string | number | boolean | null] => {
        const value = entry[1];
        return (
          value === null ||
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        );
      },
    ),
  );
  const itemRecord = item && isNodeOrderObject(item)
    ? (item as Record<string, unknown>)
    : null;
  const tags = itemRecord?.tags;
  const nestedTags =
    typeof tags === "object" &&
    tags !== null &&
    !Array.isArray(tags)
      ? Object.fromEntries(
          Object.entries(tags).filter(
            (entry): entry is [string, string | number | boolean | null] => {
              const value = entry[1];
              return (
                value === null ||
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean"
              );
            },
          ),
        )
      : {};

  return { ...flatTags, ...nestedTags };
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
      tags: getNodeOrderTags(nodeOrder[index]),
      coords: null,
      metadata: {},
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
