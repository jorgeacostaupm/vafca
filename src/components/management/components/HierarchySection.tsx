import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Select, Space, Typography } from "antd";
import type { ReactNode } from "react";
import type {
  CategoryOrderEditor,
  CategoryOrderMap,
  MoveDirection,
} from "@/components/management/types";
import { moveValue, reverseValues } from "@/components/management/utils/hierarchyOrder";
import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";

type HierarchySectionProps = {
  title: string;
  description: string;
  addFieldPlaceholder: string;
  emptyHierarchyMessage: string;
  hierarchyFields: string[];
  selectableFields: string[];
  categoryOrderEditors: CategoryOrderEditor[];
  categoryOrder: CategoryOrderMap;
  onMoveField: (field: string, direction: MoveDirection) => void;
  onRemoveField: (field: string) => void;
  onAddField: (field: string) => void;
  onReverseFieldOrder: () => void;
  onUpdateCategoryOrder: (next: CategoryOrderMap) => void;
  resolveParentField: (index: number) => string;
  preview: ReactNode;
};

function HierarchySection({
  title,
  description,
  addFieldPlaceholder,
  emptyHierarchyMessage,
  hierarchyFields,
  selectableFields,
  categoryOrderEditors,
  categoryOrder,
  onMoveField,
  onRemoveField,
  onAddField,
  onReverseFieldOrder,
  onUpdateCategoryOrder,
  resolveParentField,
  preview,
}: HierarchySectionProps) {
  return (
    <div>
      <Typography.Text strong>{title}</Typography.Text>
      <Space direction="vertical" size={8} style={{ width: "100%", marginTop: 8 }}>
        <Typography.Text type="secondary">{description}</Typography.Text>

        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          {hierarchyFields.map((field, index) => (
            <div key={field} className="atlas-panel__field-row">
              <Typography.Text strong>{humanizeFieldName(field)}</Typography.Text>
              <Space>
                <Button
                  size="small"
                  icon={<ArrowUpOutlined />}
                  onClick={() => onMoveField(field, "up")}
                  disabled={index === 0}
                  aria-label={`Move ${humanizeFieldName(field)} up`}
                />
                <Button
                  size="small"
                  icon={<ArrowDownOutlined />}
                  onClick={() => onMoveField(field, "down")}
                  disabled={index === hierarchyFields.length - 1}
                  aria-label={`Move ${humanizeFieldName(field)} down`}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onRemoveField(field)}
                  aria-label={`Remove ${humanizeFieldName(field)}`}
                />
              </Space>
            </div>
          ))}
        </Space>

        <Select
          placeholder={addFieldPlaceholder}
          style={{ width: "100%" }}
          options={selectableFields.map((field) => ({
            value: field,
            label: humanizeFieldName(field),
          }))}
          value={undefined}
          onChange={(value) => onAddField(String(value))}
        />

        <Button
          size="small"
          onClick={onReverseFieldOrder}
          disabled={hierarchyFields.length < 2}
        >
          Invert hierarchy order
        </Button>

        {hierarchyFields.length === 0 ? (
          <Typography.Text type="secondary">{emptyHierarchyMessage}</Typography.Text>
        ) : (
          <Typography.Text type="secondary">
            Active hierarchy: {hierarchyFields.map(humanizeFieldName).join(" → ")}
          </Typography.Text>
        )}

        {categoryOrderEditors.length > 0 && (
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Typography.Text strong>Category order per branch</Typography.Text>
            {categoryOrderEditors.map((editor) => {
              const parentDescription =
                editor.parentValues.length === 0
                  ? "Root level"
                  : editor.parentValues
                      .map((value, index) => {
                        const parentField = resolveParentField(index);
                        return `${humanizeFieldName(parentField)}: ${value}`;
                      })
                      .join(" · ");

              return (
                <div
                  key={editor.key}
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    padding: 8,
                    background: "var(--color-surface)",
                  }}
                >
                  <Typography.Text strong>{humanizeFieldName(editor.field)}</Typography.Text>
                  <Typography.Text type="secondary" style={{ display: "block" }}>
                    {parentDescription}
                  </Typography.Text>
                  <Button
                    size="small"
                    style={{ marginTop: 6 }}
                    onClick={() =>
                      onUpdateCategoryOrder({
                        ...categoryOrder,
                        [editor.key]: reverseValues(editor.values),
                      })
                    }
                    disabled={editor.values.length < 2}
                  >
                    Invert branch order
                  </Button>

                  <Space
                    direction="vertical"
                    size={6}
                    style={{ width: "100%", marginTop: 6 }}
                  >
                    {editor.values.map((value, index) => (
                      <div key={value} className="atlas-panel__field-row">
                        <Typography.Text>{value}</Typography.Text>
                        <Space>
                          <Button
                            size="small"
                            icon={<ArrowUpOutlined />}
                            onClick={() =>
                              onUpdateCategoryOrder({
                                ...categoryOrder,
                                [editor.key]: moveValue(editor.values, value, "up"),
                              })
                            }
                            disabled={index === 0}
                            aria-label={`Move ${value} up`}
                          />
                          <Button
                            size="small"
                            icon={<ArrowDownOutlined />}
                            onClick={() =>
                              onUpdateCategoryOrder({
                                ...categoryOrder,
                                [editor.key]: moveValue(editor.values, value, "down"),
                              })
                            }
                            disabled={index === editor.values.length - 1}
                            aria-label={`Move ${value} down`}
                          />
                        </Space>
                      </div>
                    ))}
                  </Space>
                </div>
              );
            })}
          </Space>
        )}

        {preview}
      </Space>
    </div>
  );
}

export default HierarchySection;
