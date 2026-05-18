import { Button, Space, Typography } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  downloadCurrentDataset,
} from "@/store/slices/dataset";
import DatasetSummaryHeader from "@/components/management/components/DatasetSummaryHeader";
import MatrixSummarySection from "@/components/management/components/MatrixSummarySection";
import CatalogManagementSections from "@/components/management/components/catalogs/CatalogManagementSections";
import MatrixUploader from "@/components/management/components/MatrixUploader";

function DatasetManagement() {
  const dispatch = useAppDispatch();
  const { data, status, error, downloadStatus } = useAppSelector(
    (state) => state.dataset,
  );

  if (status === "loading") {
    return <Typography.Text>Loading dataset…</Typography.Text>;
  }

  if (status === "error") {
    return <Typography.Text type="danger">Error: {error}</Typography.Text>;
  }

  if (!data) {
    return (
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Typography.Text>No dataset loaded yet.</Typography.Text>
        <MatrixUploader />
      </Space>
    );
  }

  const handleDownload = () => {
    void dispatch(downloadCurrentDataset());
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <DatasetSummaryHeader />

      <MatrixSummarySection />

      <MatrixUploader />

      <Button
        size="small"
        onClick={handleDownload}
        loading={downloadStatus === "loading"}
      >
        Download dataset as JSON
      </Button>

      <CatalogManagementSections />
    </Space>
  );
}

export default DatasetManagement;
