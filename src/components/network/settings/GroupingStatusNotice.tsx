import { Typography } from "antd";

import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";

type GroupingStatusNoticeProps = {
  appliedFields: string[];
  previewFields: string[];
  hasPendingChanges: boolean;
};

const formatFields = (fields: string[]) =>
  fields.map((field) => humanizeFieldName(field)).join(" -> ");

export default function GroupingStatusNotice({
  appliedFields,
  previewFields,
  hasPendingChanges,
}: GroupingStatusNoticeProps) {
  const activeLabel =
    appliedFields.length > 0 ? formatFields(appliedFields) : "No grouping";
  const previewLabel =
    previewFields.length > 0 ? formatFields(previewFields) : "No grouping";

  return (
    <div className="network-settings-grouping__status">
      <Typography.Text strong>
        Active: <Typography.Text>{activeLabel}</Typography.Text>
      </Typography.Text>
      {hasPendingChanges ? (
        <Typography.Text type="secondary">Preview: {previewLabel}</Typography.Text>
      ) : null}
    </div>
  );
}
