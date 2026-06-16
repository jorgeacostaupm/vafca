import { Typography } from "antd";

import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";

type GroupingStatusNoticeProps = {
  appliedFields: string[];
};

const formatFields = (fields: string[]) =>
  fields.map((field) => humanizeFieldName(field)).join(" -> ");

export default function GroupingStatusNotice({
  appliedFields,
}: GroupingStatusNoticeProps) {
  const activeLabel =
    appliedFields.length > 0 ? formatFields(appliedFields) : "No grouping";

  return (
    <Typography.Text className="network-settings-grouping__status" type="secondary">
      Active grouping: {activeLabel}
    </Typography.Text>
  );
}
