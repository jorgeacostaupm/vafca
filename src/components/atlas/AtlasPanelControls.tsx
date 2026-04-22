import { Button, Select, Space, Typography } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { D3CategoricalPaletteKey } from "@/types/atlas";
import { D3_CATEGORICAL_PALETTES } from "@/utils/atlas/coloring";
import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";

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
  onMoveGroupField: (field: string, direction: "up" | "down") => void;
  onRemoveGroupField: (field: string) => void;
  onAddGroupField: (field: string) => void;
  onMoveColorField: (field: string, direction: "up" | "down") => void;
  onRemoveColorField: (field: string) => void;
  onAddColorField: (field: string) => void;
  onSetColorPalette: (value: D3CategoricalPaletteKey) => void;
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
  onMoveGroupField,
  onRemoveGroupField,
  onAddGroupField,
  onMoveColorField,
  onRemoveColorField,
  onAddColorField,
  onSetColorPalette,
}: AtlasPanelControlsProps) {
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
                  onClick={() => onMoveGroupField(field, "up")}
                  disabled={index === 0}
                  aria-label={`Move ${humanizeFieldName(field)} up`}
                />
                <Button
                  size="small"
                  icon={<ArrowDownOutlined />}
                  onClick={() => onMoveGroupField(field, "down")}
                  disabled={index === groupByFields.length - 1}
                  aria-label={`Move ${humanizeFieldName(field)} down`}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onRemoveGroupField(field)}
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
          onChange={(value) => onAddGroupField(String(value))}
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
                  onClick={() => onMoveColorField(field, "up")}
                  disabled={index === 0}
                  aria-label={`Move ${humanizeFieldName(field)} up`}
                />
                <Button
                  size="small"
                  icon={<ArrowDownOutlined />}
                  onClick={() => onMoveColorField(field, "down")}
                  disabled={index === colorFields.length - 1}
                  aria-label={`Move ${humanizeFieldName(field)} down`}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onRemoveColorField(field)}
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
          onChange={(value) => onAddColorField(String(value))}
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
                onChange={(value) => onSetColorPalette(value as D3CategoricalPaletteKey)}
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
