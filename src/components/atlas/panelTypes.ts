import type { GroupedRow } from "@/types/atlasPanel";

export type GroupRow = Extract<GroupedRow, { type: "group" }>;
export type NodeRow = Extract<GroupedRow, { type: "node" }>;

export type NodeTreeNode = {
  type: "node";
  row: NodeRow;
};

export type GroupTreeNode = {
  type: "groupNode";
  row: GroupRow;
  children: GroupTreeEntry[];
};

export type GroupTreeEntry = NodeTreeNode | GroupTreeNode;
