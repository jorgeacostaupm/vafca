import { memo, useCallback, useMemo, type Key } from "react";
import { Button, Collapse, List, Space, Typography } from "antd";
import type { GroupTreeEntry, RoiTreeNode } from "./panelTypes";
import { AtlasRoiListItem } from "./AtlasRoiListItem";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLabelsEnabled } from "@/store/slices/atlas";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";

type AtlasGroupedListProps = {
  entries: GroupTreeEntry[];
  level?: number;
};

const EMPTY_TEXT = "No labels found for current filters.";

const renderRoiRow = (row: RoiTreeNode) => (
  <AtlasRoiListItem id={row.row.id} />
);

const getRoiRowKey = (row: RoiTreeNode) => row.row.key;

const collectRoiIds = (entries: GroupTreeEntry[]): string[] =>
  entries.flatMap((entry) =>
    entry.type === "roiNode" ? [entry.row.id] : collectRoiIds(entry.children),
  );

export const AtlasGroupedList = memo(function AtlasGroupedList({
  entries,
  level = 0,
}: AtlasGroupedListProps) {
  const dispatch = useAppDispatch();
  const collapsedGroupIds = useAppSelector(
    (state) => state.visualizationUi.atlasPanel.collapsedGroups,
  );
  const collapsedGroups = useMemo(
    () => new Set(collapsedGroupIds),
    [collapsedGroupIds],
  );

  const handleCollapseChange = useCallback(
    (groupKeys: string[], activeKeys: Key | Key[]) => {
      const expanded = new Set(
        (Array.isArray(activeKeys) ? activeKeys : [activeKeys])
          .filter((key): key is Key => key !== undefined && key !== null)
          .map((key) => String(key)),
      );

      const nextCollapsed = new Set(collapsedGroups);
      groupKeys.forEach((key) => {
        if (expanded.has(key)) {
          nextCollapsed.delete(key);
        } else {
          nextCollapsed.add(key);
        }
      });

      dispatch(setAtlasPanelState({ collapsedGroups: Array.from(nextCollapsed) }));
    },
    [collapsedGroups, dispatch],
  );

  const handleSetGroupEnabled = useCallback(
    (entriesToUpdate: GroupTreeEntry[], enabled: boolean) => {
      const ids = collectRoiIds(entriesToUpdate);
      if (ids.length === 0) return;
      dispatch(setLabelsEnabled({ ids, enabled }));
    },
    [dispatch],
  );

  if (entries.length === 0) {
    return (
      <List
        dataSource={[]}
        renderItem={renderRoiRow}
        locale={{ emptyText: EMPTY_TEXT }}
      />
    );
  }

  const roiRows = entries.flatMap((entry) =>
    entry.type === "roiNode" ? [entry] : [],
  );
  const groupNodes = entries.flatMap((entry) =>
    entry.type === "groupNode" ? [entry] : [],
  );

  if (groupNodes.length === 0) {
    return (
      <List
        dataSource={roiRows}
        rowKey={getRoiRowKey}
        renderItem={renderRoiRow}
        locale={{ emptyText: EMPTY_TEXT }}
      />
    );
  }

  const groupKeys = groupNodes.map((group) => group.row.groupKey);
  const activeKeys = groupKeys.filter((key) => !collapsedGroups.has(key));

  if (roiRows.length > 0) {
    return (
      <List
        dataSource={roiRows}
        rowKey={getRoiRowKey}
        renderItem={renderRoiRow}
        locale={{ emptyText: EMPTY_TEXT }}
      />
    );
  }

  return (
    <Collapse
      bordered={true}
      className="atlas-panel__group-collapse"
      style={level > 0 ? { marginInlineStart: 10 } : undefined}
      activeKey={activeKeys}
      onChange={(nextKeys) => handleCollapseChange(groupKeys, nextKeys)}
      items={groupNodes.map((group) => ({
        key: group.row.groupKey,
        label: (
          <div className="atlas-panel__group-header">
            <Space size={6}>
              <Typography.Text>{group.row.title}</Typography.Text>
              <Typography.Text type="secondary">
                ({group.row.count})
              </Typography.Text>
            </Space>
            <Space size={4}>
              <Button
                size="small"
                type="text"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleSetGroupEnabled(group.children, true);
                }}
              >
                Select all
              </Button>
              <Button
                size="small"
                type="text"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleSetGroupEnabled(group.children, false);
                }}
              >
                Clear all
              </Button>
            </Space>
          </div>
        ),
        children: (
          <AtlasGroupedList entries={group.children} level={level + 1} />
        ),
      }))}
    />
  );
});
