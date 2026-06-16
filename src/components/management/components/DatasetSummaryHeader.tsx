import { Space, Typography } from "antd";

import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import { getDatasetNetworkStats } from "@/utils/datasetAccessors";

function DatasetSummaryHeader() {
  const data = useAppSelector((state) => selectDatasetData(state));

  if (!data) return null;
  const networkStats = getDatasetNetworkStats(data);

  return (
    <Space wrap size={16}>
      <Space size={6}>
        <Typography.Text strong>Networks:</Typography.Text>
        <Typography.Text type="secondary">{networkStats.total}</Typography.Text>
      </Space>
    </Space>
  );
}

export default DatasetSummaryHeader;
