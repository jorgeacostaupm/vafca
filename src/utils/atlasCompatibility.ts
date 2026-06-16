import type { AtlasDefinition } from "@/types/atlas";
import type { NodeOrderItem } from "@/types/nodeOrder";
import { normalizeNodeOrder } from "@/utils/nodeOrder";

export type AtlasCompatibilityResult =
  | { compatible: true; nodeCount: number; atlasNodeCount: number }
  | {
      compatible: false;
      nodeCount: number;
      atlasNodeCount: number;
      reason: string;
    };

const findMissingIds = (sourceIds: string[], targetIds: string[]) => {
  const targetSet = new Set(targetIds);
  return sourceIds.filter((id) => !targetSet.has(id));
};

const findAtlasNodesMissingFromNodeOrder = (
  atlas: AtlasDefinition | null | undefined,
  nodeIds: string[],
) => {
  const nodeSet = new Set(nodeIds);
  return (
    atlas?.nodes
      .filter((node) => !nodeSet.has(String(node.id)) && !nodeSet.has(String(node.atlasId)))
      .map((node) => String(node.id)) ?? []
  );
};

const summarizeMissingIds = (missingIds: string[], sourceName: string) => {
  const shownIds = missingIds.slice(0, 5).join(", ");
  const suffix = missingIds.length > 5 ? ` and ${missingIds.length - 5} more` : "";
  return `${sourceName} is missing Node id${missingIds.length === 1 ? "" : "s"}: ${shownIds}${suffix}.`;
};

export const checkAtlasNodeCompatibility = (
  nodeOrder: NodeOrderItem[] | undefined | null,
  atlas: AtlasDefinition | null | undefined,
): AtlasCompatibilityResult => {
  const nodeIds = normalizeNodeOrder(nodeOrder).map((entry) => entry.id);
  const atlasIds = atlas?.nodes.map((node) => String(node.id)) ?? [];
  const atlasCompatibleIds = atlas?.nodes.flatMap((node) => [
    String(node.id),
    String(node.atlasId),
  ]) ?? [];

  if (nodeIds.length === 0 || atlasIds.length === 0) {
    return {
      compatible: true,
      nodeCount: nodeIds.length,
      atlasNodeCount: atlasIds.length,
    };
  }

  if (nodeIds.length !== atlasIds.length) {
    return {
      compatible: false,
      nodeCount: nodeIds.length,
      atlasNodeCount: atlasIds.length,
      reason: `Node order has ${nodeIds.length} nodes, atlas has ${atlasIds.length} Nodes.`,
    };
  }

  const missingFromAtlas = findMissingIds(nodeIds, atlasCompatibleIds);
  if (missingFromAtlas.length > 0) {
    return {
      compatible: false,
      nodeCount: nodeIds.length,
      atlasNodeCount: atlasIds.length,
      reason: summarizeMissingIds(missingFromAtlas, "Atlas"),
    };
  }

  const missingFromNodeOrder = findAtlasNodesMissingFromNodeOrder(atlas, nodeIds);
  if (missingFromNodeOrder.length > 0) {
    return {
      compatible: false,
      nodeCount: nodeIds.length,
      atlasNodeCount: atlasIds.length,
      reason: summarizeMissingIds(missingFromNodeOrder, "Node order"),
    };
  }

  return {
    compatible: true,
    nodeCount: nodeIds.length,
    atlasNodeCount: atlasIds.length,
  };
};
