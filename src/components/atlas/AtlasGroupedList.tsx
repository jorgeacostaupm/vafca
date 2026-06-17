import {
  CheckSquareOutlined,
  ClearOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Button, List, Tooltip, Typography } from "antd";
import { memo, useCallback, useMemo } from "react";
import { shallowEqual } from "react-redux";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";

import { AtlasNodeListItem } from "./AtlasNodeListItem";
import { buildEffectiveNodeEnabledMap } from "./nodeVisibilityDraft";
import type { GroupTreeEntry, NodeTreeNode } from "./panelTypes";

type AtlasGroupedListProps = {
  entries: GroupTreeEntry[];
  level?: number;
};

const EMPTY_TEXT = "No labels found for current filters.";

const renderNodeRow = (row: NodeTreeNode) => (
  <AtlasNodeListItem id={row.row.id} />
);

const getNodeRowKey = (row: NodeTreeNode) => row.row.key;

const splitEntries = (entries: GroupTreeEntry[]) => ({
  nodeRows: entries.flatMap((entry) => (entry.type === "node" ? [entry] : [])),
  groupNodes: entries.flatMap((entry) =>
    entry.type === "groupNode" ? [entry] : [],
  ),
});

const getGroupDomId = (groupKey: string) =>
  `atlas-group-title-${encodeURIComponent(groupKey)}`;

const collectNodeIds = (entries: GroupTreeEntry[]): string[] =>
  entries.flatMap((entry) =>
    entry.type === "node" ? [entry.row.id] : collectNodeIds(entry.children),
  );

const countSelectedNodes = (
  entries: GroupTreeEntry[],
  enabledById: Record<string, boolean>,
): { selected: number; total: number } => {
  let selected = 0;
  let total = 0;

  entries.forEach((entry) => {
    if (entry.type === "node") {
      total += 1;
      if (enabledById[entry.row.id] !== false) selected += 1;
      return;
    }

    const childCount = countSelectedNodes(entry.children, enabledById);
    selected += childCount.selected;
    total += childCount.total;
  });

  return { selected, total };
};

type NodeRowsProps = {
  rows: NodeTreeNode[];
  contained?: boolean;
};

const NodeRows = ({ rows, contained = false }: NodeRowsProps) => (
  <div
    className={
      contained
        ? "atlas-panel__node-list-surface"
        : "atlas-panel__node-list-wrap"
    }
  >
    <List
      className="atlas-panel__node-list"
      dataSource={rows}
      rowKey={getNodeRowKey}
      renderItem={renderNodeRow}
      locale={{ emptyText: EMPTY_TEXT }}
    />
  </div>
);

export const AtlasGroupedList = memo(function AtlasGroupedList({
  entries,
  level = 0,
}: AtlasGroupedListProps) {
  const dispatch = useAppDispatch();
  const collapsedGroupIds = useAppSelector(
    (state) => state.visualizationUi.atlasPanel.collapsedGroups,
  );
  const { draft, labelsById, order } = useAppSelector(
    (state) => ({
      draft: state.visualizationUi.atlasPanel.nodeVisibilityDraft,
      labelsById: state.atlasUi.labelsById,
      order: state.atlasUi.order,
    }),
    shallowEqual,
  );
  const collapsedGroups = useMemo(
    () => new Set(collapsedGroupIds),
    [collapsedGroupIds],
  );
  const enabledById = useMemo(
    () => buildEffectiveNodeEnabledMap({ order, labelsById, draft }),
    [draft, labelsById, order],
  );

  const handleToggleGroup = useCallback(
    (groupKey: string) => {
      const nextCollapsed = new Set(collapsedGroups);
      if (nextCollapsed.has(groupKey)) {
        nextCollapsed.delete(groupKey);
      } else {
        nextCollapsed.add(groupKey);
      }

      dispatch(setAtlasPanelState({ collapsedGroups: Array.from(nextCollapsed) }));
    },
    [collapsedGroups, dispatch],
  );

  const handleSetGroupEnabled = useCallback(
    (entriesToUpdate: GroupTreeEntry[], enabled: boolean) => {
      const ids = collectNodeIds(entriesToUpdate);
      if (ids.length === 0) return;
      const nextDraft = { ...enabledById };
      ids.forEach((id) => {
        nextDraft[id] = enabled;
      });
      dispatch(setAtlasPanelState({ nodeVisibilityDraft: nextDraft }));
    },
    [dispatch, enabledById],
  );

  if (entries.length === 0) {
    return <NodeRows rows={[]} contained={level === 0} />;
  }

  const { nodeRows, groupNodes } = splitEntries(entries);

  if (groupNodes.length === 0) {
    return <NodeRows rows={nodeRows} contained={level === 0} />;
  }

  return (
    <div
      className={
        level === 0
          ? "atlas-panel__group-tree atlas-panel__group-tree--root"
          : "atlas-panel__group-tree atlas-panel__group-tree--nested"
      }
    >
      {nodeRows.length > 0 ? <NodeRows rows={nodeRows} /> : null}
      {groupNodes.map((group) => {
        const collapsed = collapsedGroups.has(group.row.groupKey);
        const titleId = getGroupDomId(group.row.groupKey);
        const groupCount = countSelectedNodes(group.children, enabledById);

        return (
          <div
            key={group.row.groupKey}
            className={
              level === 0
                ? "atlas-panel__group-node"
                : "atlas-panel__group-node atlas-panel__group-node--nested"
            }
            aria-labelledby={titleId}
          >
            <div className="atlas-panel__group-header">
              <button
                type="button"
                className="atlas-panel__group-title-button"
                aria-expanded={!collapsed}
                aria-controls={`${titleId}-body`}
                onClick={() => handleToggleGroup(group.row.groupKey)}
              >
                <span className="atlas-panel__group-chevron" aria-hidden="true">
                  {collapsed ? <RightOutlined /> : <DownOutlined />}
                </span>
                <Typography.Text
                  id={titleId}
                  strong
                  className="atlas-panel__group-title"
                >
                  {group.row.title}
                </Typography.Text>
                <Typography.Text
                  type="secondary"
                  className="atlas-panel__group-count"
                >
                  {groupCount.selected}/{groupCount.total}
                </Typography.Text>
              </button>
              <div className="atlas-panel__group-actions">
                <Tooltip title="Select all nodes in this group">
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckSquareOutlined />}
                    aria-label="Select all nodes in this group"
                    onClick={() => handleSetGroupEnabled(group.children, true)}
                  />
                </Tooltip>
                <Tooltip title="Clear all nodes in this group">
                  <Button
                    size="small"
                    type="primary"
                    icon={<ClearOutlined />}
                    aria-label="Clear all nodes in this group"
                    onClick={() => handleSetGroupEnabled(group.children, false)}
                  />
                </Tooltip>
              </div>
            </div>
            {!collapsed ? (
              <div
                id={`${titleId}-body`}
                className="atlas-panel__group-body"
              >
                <AtlasGroupedList entries={group.children} level={level + 1} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
});
