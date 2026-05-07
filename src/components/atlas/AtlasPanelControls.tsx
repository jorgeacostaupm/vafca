import { useCallback } from "react";
import { Button, Select, Space, Typography } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import { moveField } from "./panelFieldUtils";

type AtlasPanelControlsProps = {
  totalCount: number;
  enabledCount: number;
  groupByFields: string[];
  selectableGroupFields: string[];
};

export function AtlasPanelControls({
  totalCount,
  enabledCount,
  groupByFields,
  selectableGroupFields,
}: AtlasPanelControlsProps) {
  const dispatch = useAppDispatch();
  const selectedFilters = useAppSelector(
    (state) => state.visualizationUi.atlasPanel.selectedFilters,
  );

  const handleMoveGroupField = useCallback(
    (field: string, direction: "up" | "down") => {
      dispatch(
        setAtlasPanelState({
          groupByFields: moveField(groupByFields, field, direction),
          collapsedGroups: [],
        }),
      );
    },
    [dispatch, groupByFields],
  );

  const handleRemoveGroupField = useCallback(
    (field: string) => {
      const nextSelectedFilters = { ...selectedFilters };
      delete nextSelectedFilters[field];

      dispatch(
        setAtlasPanelState({
          groupByFields: groupByFields.filter((value) => value !== field),
          selectedFilters: nextSelectedFilters,
          collapsedGroups: [],
        }),
      );
    },
    [dispatch, groupByFields, selectedFilters],
  );

  const handleAddGroupField = useCallback(
    (field: string) => {
      dispatch(
        setAtlasPanelState({
          groupByFields: [...groupByFields, field],
          collapsedGroups: [],
        }),
      );
    },
    [dispatch, groupByFields],
  );

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Space direction="vertical" size={2}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            ROIs Management
          </Typography.Title>
          <Typography.Text type="secondary">
            {totalCount} ROIs · {enabledCount} active
          </Typography.Text>
        </Space>
      </Space>

      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Typography.Text strong>Grouping fields (order matters)</Typography.Text>

        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          {groupByFields.map((field, index) => (
            <div key={field} className="atlas-panel__field-row">
              <Typography.Text strong>{humanizeFieldName(field)}</Typography.Text>
              <Space>
                <Button
                  size="small"
                  icon={<ArrowUpOutlined />}
                  onClick={() => handleMoveGroupField(field, "up")}
                  disabled={index === 0}
                  aria-label={`Move ${humanizeFieldName(field)} up`}
                />
                <Button
                  size="small"
                  icon={<ArrowDownOutlined />}
                  onClick={() => handleMoveGroupField(field, "down")}
                  disabled={index === groupByFields.length - 1}
                  aria-label={`Move ${humanizeFieldName(field)} down`}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveGroupField(field)}
                  aria-label={`Remove ${humanizeFieldName(field)}`}
                />
              </Space>
            </div>
          ))}
        </Space>

        <Select
          placeholder="Add field"
          style={{ width: "100%" }}
          options={selectableGroupFields.map((field) => ({
            value: field,
            label: humanizeFieldName(field),
          }))}
          onChange={(value) => handleAddGroupField(String(value))}
          value={undefined}
        />
      </Space>

    </Space>
  );
}
