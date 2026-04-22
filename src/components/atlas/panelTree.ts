import type { GroupedRow } from "@/types/atlasPanel";
import type { GroupTreeEntry, GroupTreeNode, RoiTreeNode } from "./panelTypes";

export const buildGroupTreeEntries = (rows: GroupedRow[]): GroupTreeEntry[] => {
  const roots: GroupTreeEntry[] = [];
  const groupStack: GroupTreeNode[] = [];

  rows.forEach((row) => {
    while (groupStack.length > row.level) {
      groupStack.pop();
    }

    if (row.type === "group") {
      const groupNode: GroupTreeNode = {
        type: "groupNode",
        row,
        children: [],
      };
      const parent = groupStack[groupStack.length - 1];
      if (parent) {
        parent.children.push(groupNode);
      } else {
        roots.push(groupNode);
      }
      groupStack.push(groupNode);
      return;
    }

    const roiNode: RoiTreeNode = {
      type: "roiNode",
      row,
    };
    const parent = groupStack[groupStack.length - 1];
    if (parent) {
      parent.children.push(roiNode);
    } else {
      roots.push(roiNode);
    }
  });

  return roots;
};

const collectRoiIdsFromEntries = (entries: GroupTreeEntry[]): string[] => {
  const ids: string[] = [];

  entries.forEach((entry) => {
    if (entry.type === "roiNode") {
      ids.push(entry.row.id);
      return;
    }
    ids.push(...collectRoiIdsFromEntries(entry.children));
  });

  return ids;
};

export const buildGroupRoiIdsByKey = (
  entries: GroupTreeEntry[],
  map: Record<string, string[]> = {},
): Record<string, string[]> => {
  entries.forEach((entry) => {
    if (entry.type !== "groupNode") return;
    map[entry.row.groupKey] = collectRoiIdsFromEntries(entry.children);
    buildGroupRoiIdsByKey(entry.children, map);
  });

  return map;
};
