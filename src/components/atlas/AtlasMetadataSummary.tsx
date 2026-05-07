import { Space, Typography } from "antd";
import { useAppSelector } from "@/store/hooks";
import { normalizeMatrixOrder } from "@/utils/matrixOrder";

export default function AtlasMetadataSummary() {
  const data = useAppSelector((state) => state.dataset.data);

  if (!data) return null;

  const matrixOrder = normalizeMatrixOrder(data.metadata.matrixOrder);
  const atlasLabel = data.metadata.atlasId ?? data.metadata.atlas ?? "Unknown";

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
