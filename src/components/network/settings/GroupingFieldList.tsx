import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";

import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";

type GroupingFieldListProps = {
  fields: string[];
  onMoveField: (field: string, direction: "up" | "down") => void;
  onRemoveField: (field: string) => void;
};

export default function GroupingFieldList({
  fields,
  onMoveField,
  onRemoveField,
}: GroupingFieldListProps) {
  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      {fields.map((field, index) => (
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
              disabled={index === fields.length - 1}
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
  );
}
