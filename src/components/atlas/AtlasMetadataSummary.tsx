import { Space, Typography } from "antd";

import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import {
  getDatasetAtlasLabel,
  getDatasetMatrixOrder,
} from "@/utils/datasetAccessors";

export default function AtlasMetadataSummary() {
  const data = useAppSelector((state) => selectDatasetData(state));

  if (!data) return null;

  const matrixOrder = getDatasetMatrixOrder(data);
  const atlasLabel = getDatasetAtlasLabel(data);

  return (
    <Space wrap size={16}>
      <Space size={6}>
        <Typography.Text strong>Atlas:</Typography.Text>
        <Typography.Text type="secondary">{atlasLabel}</Typography.Text>
      </Space>

      <Space size={6}>
        <Typography.Text strong>ROI count:</Typography.Text>
        <Typography.Text type="secondary">{matrixOrder.length}</Typography.Text>
      </Space>
    </Space>
  );
}
