import * as d3 from "d3";
import type { AtlasDefinition, AtlasRoi } from "@/types/atlas";
import type { CircularHierarchyLayoutPoint } from "@/types/circular";
import { normalizeRoiFieldValue } from "@/utils/atlas/atlasDefinition";


type CircularHierarchyLayoutParams = {
  labelIds: string[];
  radius: number;
  atlasDefinition: AtlasDefinition | null;
  hierarchyFields: string[];
  categoryOrder?: Record<string, string[]>;
};

type HierarchyDataNode = {
  key: string;
  labelId?: string;
  children?: HierarchyDataNode[];
};

type MutableHierarchyNode = {
  key: string;
  children: Map<string, MutableHierarchyNode>;
  leaves: Array<{ labelId: string; inputOrder: number }>;
};

export const buildCircularCategoryOrderKey = (
  fieldIndex: number,
  parentValues: string[],
) => `${fieldIndex}::${parentValues.join("||")}`;

const buildUniformLayout = (
  labelIds: string[],
  radius: number,
): CircularHierarchyLayoutPoint[] => {
  const count = labelIds.length;
  if (count === 0) return [];
  return labelIds.map((labelId, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    return {
      labelId,
      order: index,
      angle,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });
};

const toHierarchyData = (
  node: MutableHierarchyNode,
  depth: number,
  parentValues: string[],
  categoryOrder: Record<string, string[]>,
): HierarchyDataNode => {
  const orderKey = buildCircularCategoryOrderKey(depth, parentValues);
  const configuredOrder = categoryOrder[orderKey] ?? [];
  const configuredIndex = new Map(
    configuredOrder.map((value, index) => [value, index] as const),
  );
  const sortedChildren = Array.from(node.children.values())
    .sort((a, b) => {
      const indexA = configuredIndex.get(a.key);
      const indexB = configuredIndex.get(b.key);
      const hasA = typeof indexA === "number";
      const hasB = typeof indexB === "number";
      if (hasA && hasB) return (indexA as number) - (indexB as number);
      if (hasA) return -1;
      if (hasB) return 1;
      return a.key.localeCompare(b.key, undefined, { sensitivity: "base" });
    })
    .map((child) =>
      toHierarchyData(child, depth + 1, [...parentValues, child.key], categoryOrder),
    );
  const sortedLeaves = [...node.leaves]
    .sort((a, b) => a.inputOrder - b.inputOrder)
    .map((leaf) => ({
      key: leaf.labelId,
      labelId: leaf.labelId,
    }));
  return {
    key: node.key,
    children: [...sortedChildren, ...sortedLeaves],
  };
};

const buildHierarchyRoot = (
  labelIds: string[],
  hierarchyFields: string[],
  roiById: Map<string, AtlasRoi>,
) => {
  const root: MutableHierarchyNode = {
    key: "root",
    children: new Map(),
    leaves: [],
  };

  labelIds.forEach((labelId, inputOrder) => {
    const roi = roiById.get(labelId);
    let cursor = root;
    hierarchyFields.forEach((field) => {
      const key = normalizeRoiFieldValue(roi?.[field]);
      let next = cursor.children.get(key);
      if (!next) {
        next = {
          key,
          children: new Map(),
          leaves: [],
        };
        cursor.children.set(key, next);
      }
      cursor = next;
    });
    cursor.leaves.push({ labelId, inputOrder });
  });

  return root;
};

export const buildCircularHierarchyLayout = ({
  labelIds,
  radius,
  atlasDefinition,
  hierarchyFields,
  categoryOrder = {},
}: CircularHierarchyLayoutParams): CircularHierarchyLayoutPoint[] => {
  if (labelIds.length === 0) return [];

  const cleanFields = hierarchyFields.filter((field) => field.trim().length > 0);
  if (!atlasDefinition?.rois?.length || cleanFields.length === 0) {
    return buildUniformLayout(labelIds, radius);
  }

  const roiById = new Map(
    atlasDefinition.rois.map((roi) => [String(roi.id), roi] as const),
  );
  const hierarchyRoot = buildHierarchyRoot(labelIds, cleanFields, roiById);
  const hierarchyData = toHierarchyData(hierarchyRoot, 0, [], categoryOrder);
  const root = d3.hierarchy<HierarchyDataNode>(
    hierarchyData,
    (node: HierarchyDataNode) => node.children,
  );

  const cluster = d3
    .cluster<HierarchyDataNode>()
    .size([Math.PI * 2, radius])
    .separation((a: any, b: any) => (a.parent === b.parent ? 1 : 2));

  cluster(root);

  return root
    .leaves()
    .filter((leaf: any): leaf is d3.HierarchyPointNode<HierarchyDataNode> & {
      data: HierarchyDataNode & { labelId: string };
    } => typeof leaf.data.labelId === "string")
    .sort((a: any, b: any) => a.x - b.x)
    .map((leaf: any, order: number) => {
      const angle = leaf.x - Math.PI / 2;
      return {
        labelId: leaf.data.labelId,
        order,
        angle,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
};
