import { Fragment, type Key } from "react";
import { Button, Collapse, List, Space, Switch, Typography } from "antd";
import type { AtlasState } from "@/types/atlas";
import type { GroupTreeEntry, RoiTreeNode } from "./panelTypes";

type AtlasGroupedListProps = {
  entries: GroupTreeEntry[];
  collapsedGroups: Set<string>;
  labelsById: AtlasState["labelsById"];
  level?: number;
  onToggleLabel: (id: string, enabled: boolean) => void;
  onUpdateCollapsedGroups: (groupKeys: string[], activeKeys: Key | Key[]) => void;
  onSetGroupEnabled: (groupKey: string, enabled: boolean) => void;
};

const EMPTY_TEXT = "No labels found for current filters.";

const renderRoiRow = (
  row: RoiTreeNode,
  labelsById: AtlasState["labelsById"],
  onToggleLabel: (id: string, enabled: boolean) => void,
) => {
  const id = row.row.id;
  const labelMeta = labelsById[id];
  const label = labelMeta?.label ?? id;
  const acronym = labelMeta?.acronym;
  const displayLabel = acronym && acronym !== label ? `${label} (${acronym})` : label;
  const enabled = labelsById[id]?.enabled !== false;

  return (
    <List.Item
      actions={[
        <Switch
          key={`toggle-${id}`}
          checked={enabled}
          onChange={(checked) => onToggleLabel(id, checked)}
          aria-label={`Toggle ${displayLabel}`}
        />,
      ]}
    >
      <List.Item.Meta title={displayLabel} />
    </List.Item>
  );
};

export function AtlasGroupedList({
  entries,
  collapsedGroups,
  labelsById,
  level = 0,
  onToggleLabel,
  onUpdateCollapsedGroups,
  onSetGroupEnabled,
}: AtlasGroupedListProps) {
  if (entries.length === 0) {
    return (
      <List
        dataSource={[]}
        renderItem={(row) => renderRoiRow(row, labelsById, onToggleLabel)}
        locale={{ emptyText: EMPTY_TEXT }}
      />
    );
  }

  const roiRows = entries.flatMap((entry) => (entry.type === "roiNode" ? [entry] : []));
  const groupNodes = entries.flatMap((entry) =>
    entry.type === "groupNode" ? [entry] : [],
  );

  if (groupNodes.length === 0) {
    return (
      <List
        dataSource={roiRows}
        renderItem={(row) => renderRoiRow(row, labelsById, onToggleLabel)}
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
        renderItem={(row) => renderRoiRow(row, labelsById, onToggleLabel)}
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
      onChange={(nextKeys) => onUpdateCollapsedGroups(groupKeys, nextKeys)}
      items={groupNodes.map((group) => ({
        key: group.row.groupKey,
        label: (
          <div className="atlas-panel__group-header">
            <Space size={6}>
              <Typography.Text>{group.row.title}</Typography.Text>
              <Typography.Text type="secondary">({group.row.count})</Typography.Text>
            </Space>
            <Space size={4}>
              <Button
                size="small"
                type="text"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSetGroupEnabled(group.row.groupKey, true);
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
                  onSetGroupEnabled(group.row.groupKey, false);
                }}
              >
                Clear all
              </Button>
            </Space>
          </div>
        ),
        children: (
          <Fragment>
            <AtlasGroupedList
              entries={group.children}
              level={level + 1}
              collapsedGroups={collapsedGroups}
              labelsById={labelsById}
              onToggleLabel={onToggleLabel}
              onUpdateCollapsedGroups={onUpdateCollapsedGroups}
              onSetGroupEnabled={onSetGroupEnabled}
            />
          </Fragment>
        ),
      }))}
    />
  );
}
