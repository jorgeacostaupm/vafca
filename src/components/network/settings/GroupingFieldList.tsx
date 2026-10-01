import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Button, Space, Typography } from "antd";
import type { CSSProperties } from "react";
import { Fragment } from "react";

import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";

type GroupingFieldListProps = {
  fields: string[];
  orientation?: "horizontal" | "vertical";
  fillAvailableHeight?: boolean;
  maxHeight?: number | string;
  maxWidth?: number | string;
  onMoveField: (field: string, direction: "up" | "down") => void;
  onRemoveField: (field: string) => void;
};

export default function GroupingFieldList({
  fields,
  orientation = "vertical",
  fillAvailableHeight = false,
  maxHeight,
  maxWidth,
  onMoveField,
  onRemoveField,
}: GroupingFieldListProps) {
  const isHorizontal = orientation === "horizontal";
  const moveBackIcon = isHorizontal ? <ArrowLeftOutlined /> : <ArrowUpOutlined />;
  const moveForwardIcon = isHorizontal ? <ArrowRightOutlined /> : <ArrowDownOutlined />;
  const separatorIcon = isHorizontal ? <ArrowRightOutlined /> : <ArrowDownOutlined />;
  const directionBackLabel = isHorizontal ? "left" : "up";
  const directionForwardLabel = isHorizontal ? "right" : "down";
  const style = {
    ...(maxHeight === undefined
      ? {}
      : {
          "--grouping-field-list-max-height":
            typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        }),
    ...(maxWidth === undefined
      ? {}
      : {
          "--grouping-field-list-max-width":
            typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
        }),
  } as CSSProperties;

  return (
    <div
      className={`grouping-field-list grouping-field-list--${orientation} ${
        fillAvailableHeight ? "grouping-field-list--fill-height" : ""
      }`}
      style={style}
    >
      {fields.map((field, index) => (
        <Fragment key={field}>
          <div className="grouping-field-list__field">
            <Typography.Text strong>{humanizeFieldName(field)}</Typography.Text>
            <Space>
              <Button
                size="small"
                icon={moveBackIcon}
                onClick={() => onMoveField(field, "up")}
                disabled={index === 0}
                aria-label={`Move ${humanizeFieldName(field)} ${directionBackLabel}`}
              />
              <Button
                size="small"
                icon={moveForwardIcon}
                onClick={() => onMoveField(field, "down")}
                disabled={index === fields.length - 1}
                aria-label={`Move ${humanizeFieldName(field)} ${directionForwardLabel}`}
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
          {index < fields.length - 1 ? (
            <span className="grouping-field-list__separator" aria-hidden="true">
              {separatorIcon}
            </span>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
