import { useCallback } from "react";
import { Button, Select, Space, Typography } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { D3CategoricalPaletteKey } from "@/types/atlas";
import { D3_CATEGORICAL_PALETTES } from "@/utils/atlas/coloring";
import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setAtlasColorFields,
  setAtlasColorPalette,
} from "@/store/slices/atlas";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import { moveField } from "./panelFieldUtils";

export type AtlasColorCategoryItem = {
  key: string;
  label: string;
  count: number;
  color: string;
};

type AtlasPanelControlsProps = {
  totalCount: number;
  enabledCount: number;
  groupByFields: string[];
  selectableGroupFields: string[];
  colorFields: string[];
  selectableColorFields: string[];
  colorPalette: D3CategoricalPaletteKey;
  colorCategories: AtlasColorCategoryItem[];
  colorPreviewItems: AtlasColorCategoryItem[];
};

export function AtlasPanelControls({
  totalCount,
  enabledCount,
  groupByFields,
  selectableGroupFields,
  colorFields,
  selectableColorFields,
  colorPalette,
  colorCategories,
  colorPreviewItems,
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

  const handleMoveColorField = useCallback(
    (field: string, direction: "up" | "down") => {
      dispatch(setAtlasColorFields(moveField(colorFields, field, direction)));
    },
    [colorFields, dispatch],
  );

  const handleRemoveColorField = useCallback(
    (field: string) => {
      dispatch(setAtlasColorFields(colorFields.filter((value) => value !== field)));
    },
    [colorFields, dispatch],
  );

  const handleAddColorField = useCallback(
    (field: string) => {
      dispatch(setAtlasColorFields([...colorFields, field]));
    },
    [colorFields, dispatch],
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

      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Typography.Text strong>Color fields (categorical palette)</Typography.Text>

        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          {colorFields.map((field, index) => (
            <div key={field} className="atlas-panel__field-row">
              <Typography.Text strong>{humanizeFieldName(field)}</Typography.Text>
              <Space>
                <Button
                  size="small"
                  icon={<ArrowUpOutlined />}
                  onClick={() => handleMoveColorField(field, "up")}
                  disabled={index === 0}
                  aria-label={`Move ${humanizeFieldName(field)} up`}
                />
                <Button
                  size="small"
                  icon={<ArrowDownOutlined />}
                  onClick={() => handleMoveColorField(field, "down")}
                  disabled={index === colorFields.length - 1}
                  aria-label={`Move ${humanizeFieldName(field)} down`}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveColorField(field)}
                  aria-label={`Remove ${humanizeFieldName(field)}`}
                />
              </Space>
            </div>
          ))}
        </Space>

        <Select
          placeholder="Add color field"
          style={{ width: "100%" }}
          options={selectableColorFields.map((field) => ({
            value: field,
            label: humanizeFieldName(field),
          }))}
          onChange={(value) => handleAddColorField(String(value))}
          value={undefined}
        />

        {colorFields.length === 0 ? (
          <Typography.Text type="secondary">
            No color fields selected. All ROIs use the first color of the selected
            palette.
          </Typography.Text>
        ) : (
          <>
            <div className="atlas-panel__color-preview">
              {colorCategories.length === 0 ? (
                <Typography.Text type="secondary">No categories available.</Typography.Text>
              ) : (
                colorPreviewItems.map((category) => (
                  <div
                    key={category.key}
                    className={`atlas-panel__color-category ${
                      category.count === 0 ? "atlas-panel__color-category--empty" : ""
                    }`}
                  >
                    <span
                      className="atlas-panel__color-swatch"
                      style={{ backgroundColor: category.color }}
                    />
                    <Typography.Text ellipsis={{ tooltip: category.label }}>
                      {category.label}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {category.count > 0 ? `(${category.count})` : "(preview)"}
                    </Typography.Text>
                  </div>
                ))
              )}
            </div>

            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Typography.Text type="secondary">Palette</Typography.Text>
              <Select
                value={colorPalette}
                style={{ width: "100%" }}
                onChange={(value) =>
                  dispatch(setAtlasColorPalette(value as D3CategoricalPaletteKey))
                }
                options={Object.keys(D3_CATEGORICAL_PALETTES).map((key) => ({
                  value: key,
                  label: `D3 ${key}`,
                }))}
              />
            </Space>
          </>
        )}
      </Space>
    </Space>
  );
}
