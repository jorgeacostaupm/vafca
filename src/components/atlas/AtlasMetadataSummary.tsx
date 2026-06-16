import { Space, Typography } from "antd";

import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import {
  getDatasetAtlasLabel,
  getDatasetNodeOrder,
} from "@/utils/datasetAccessors";

export default function AtlasMetadataSummary() {
  const data = useAppSelector((state) => selectDatasetData(state));

  if (!data) return null;

  const nodeOrder = getDatasetNodeOrder(data);
  const atlasLabel = getDatasetAtlasLabel(data);

  return (
    <Space wrap size={16}>
      <Space size={6}>
        <Typography.Text strong>Atlas:</Typography.Text>
        <Typography.Text type="secondary">{atlasLabel}</Typography.Text>
      </Space>

      <Space size={6}>
        <Typography.Text strong>Node count:</Typography.Text>
        <Typography.Text type="secondary">{nodeOrder.length}</Typography.Text>
      </Space>
    </Space>
  );
}
