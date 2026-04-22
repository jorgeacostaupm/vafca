import type { GroupedRow } from "@/types/atlasPanel";

export type GroupRow = Extract<GroupedRow, { type: "group" }>;
export type RoiRow = Extract<GroupedRow, { type: "roi" }>;

export type RoiTreeNode = {
  type: "roiNode";
  row: RoiRow;
};

export type GroupTreeNode = {
  type: "groupNode";
  row: GroupRow;
  children: GroupTreeEntry[];
};

export type GroupTreeEntry = RoiTreeNode | GroupTreeNode;
