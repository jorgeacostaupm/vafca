import { useCallback } from "react";
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Select, Space, Typography } from "antd";
import type { D3CategoricalPaletteKey } from "@/types/atlas";
import { useAppDispatch } from "@/store/hooks";
import { setAtlasColorFields, setAtlasColorPalette } from "@/store/slices/atlas";
import { D3_CATEGORICAL_PALETTES } from "@/utils/atlas/coloring";
import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";
import { moveField } from "@/components/atlas/panelFieldUtils";
import { useAtlasPaletteSettings } from "./useAtlasPaletteSettings";

export default function PaletteSettingsTab() {
  const dispatch = useAppDispatch();
  const {
    colorFields,
    colorPalette,
    selectableColorFields,
    colorCategories,
    colorPreviewItems,
  } = useAtlasPaletteSettings();

  const handleMoveField = useCallback(
    (field: string, direction: "up" | "down") => {
      dispatch(setAtlasColorFields(moveField(colorFields, field, direction)));
    },
    [colorFields, dispatch],
  );

  const handleRemoveField = useCallback(
    (field: string) => {
      dispatch(setAtlasColorFields(colorFields.filter((value) => value !== field)));
    },
    [colorFields, dispatch],
  );

  const handleAddField = useCallback(
    (field: string) => {
      dispatch(setAtlasColorFields([...colorFields, field]));
    },
    [colorFields, dispatch],
  );

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <Typography.Text strong>Color fields</Typography.Text>
        <Typography.Text type="secondary">
          These fields define the categorical colors used by atlas nodes.
        </Typography.Text>
      </Space>

      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        {colorFields.map((field, index) => (
          <div key={field} className="atlas-panel__field-row">
            <Typography.Text strong>{humanizeFieldName(field)}</Typography.Text>
            <Space>
              <Button
                size="small"
                icon={<ArrowUpOutlined />}
                onClick={() => handleMoveField(field, "up")}
                disabled={index === 0}
                aria-label={`Move ${humanizeFieldName(field)} up`}
              />
              <Button
                size="small"
                icon={<ArrowDownOutlined />}
                onClick={() => handleMoveField(field, "down")}
                disabled={index === colorFields.length - 1}
                aria-label={`Move ${humanizeFieldName(field)} down`}
              />
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveField(field)}
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
        onChange={(value) => handleAddField(String(value))}
        value={undefined}
      />

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

      {colorFields.length === 0 ? (
        <Typography.Text type="secondary">
          No color fields selected. All ROIs use the first color of the palette.
        </Typography.Text>
      ) : (
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
      )}
    </Space>
  );
}
