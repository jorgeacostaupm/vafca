import type { GroupedRow } from "@/types/atlasPanel";

import type { GroupTreeEntry, GroupTreeNode, NodeTreeNode } from "./panelTypes";

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

    const node: NodeTreeNode = {
      type: "node",
      row,
    };
    const parent = groupStack[groupStack.length - 1];
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};
