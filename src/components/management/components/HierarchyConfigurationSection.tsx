import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Select, Space, Typography } from "antd";
import type { MoveDirection } from "@/components/management/types";
import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";

type HierarchyConfigurationSectionProps = {
  description: string;
  addFieldPlaceholder: string;
  emptyHierarchyMessage: string;
  hierarchyFields: string[];
  selectableFields: string[];
  onMoveField: (field: string, direction: MoveDirection) => void;
  onRemoveField: (field: string) => void;
  onAddField: (field: string) => void;
  onReverseFieldOrder: () => void;
};

export default function HierarchyConfigurationSection({
  description,
  addFieldPlaceholder,
  emptyHierarchyMessage,
  hierarchyFields,
  selectableFields,
  onMoveField,
  onRemoveField,
  onAddField,
  onReverseFieldOrder,
}: HierarchyConfigurationSectionProps) {
  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
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
    </Space>
  );
}
