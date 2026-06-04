import { Space, Typography } from "antd";

import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import { getDatasetMatrixStats } from "@/utils/datasetAccessors";

function DatasetSummaryHeader() {
  const data = useAppSelector((state) => selectDatasetData(state));

  if (!data) return null;
  const matrixStats = getDatasetMatrixStats(data);

  return (
    <Space wrap size={16}>
      <Space size={6}>
        <Typography.Text strong>Matrices:</Typography.Text>
        <Typography.Text type="secondary">{matrixStats.total}</Typography.Text>
      </Space>
    </Space>
  );
}

export default DatasetSummaryHeader;
