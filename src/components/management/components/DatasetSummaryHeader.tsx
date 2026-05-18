import { Space, Typography } from "antd";
import { useAppSelector } from "@/store/hooks";

function DatasetSummaryHeader() {
  const data = useAppSelector((state) => state.dataset.data);

  if (!data) return null;

  return (
    <Space wrap size={16}>
      <Space size={6}>
        <Typography.Text strong>Matrices:</Typography.Text>
        <Typography.Text type="secondary">{data.matrixStats.total}</Typography.Text>
      </Space>
    </Space>
  );
}

export default DatasetSummaryHeader;
