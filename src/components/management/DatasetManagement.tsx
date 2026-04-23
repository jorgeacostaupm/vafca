import { Button, Space, Typography, message } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  downloadCurrentDataset,
} from "@/store/slices/dataset";
import NetworkManagementControls from "@/components/network/NetworkManagementControls";
import AtlasUploader from "@/components/atlas/AtlasUploader";
import DatasetSummaryHeader from "@/components/management/components/DatasetSummaryHeader";
import MatrixSummarySection from "@/components/management/components/MatrixSummarySection";
import DatasetHierarchyManagement from "@/components/management/components/DatasetHierarchyManagement";
import CatalogManagementSections from "@/components/management/components/catalogs/CatalogManagementSections";

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
    return <Typography.Text>No dataset loaded yet.</Typography.Text>;
  }

  const handleDownload = () => {
    void dispatch(downloadCurrentDataset())
      .unwrap()
      .then(({ fileName }) => {
        message.success(`Dataset downloaded: ${fileName}`);
      })
      .catch((caught) => {
        const nextError =
          typeof caught === "string"
            ? caught
            : caught instanceof Error
              ? caught.message
              : "Failed to export dataset.";
        message.error(nextError);
      });
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <AtlasUploader />

      <DatasetSummaryHeader />

      <div>
        <NetworkManagementControls />
      </div>

      <MatrixSummarySection />

      <Button
        size="small"
        onClick={handleDownload}
        loading={downloadStatus === "loading"}
      >
        Download dataset as JSON
      </Button>

      <DatasetHierarchyManagement />

      <CatalogManagementSections />
    </Space>
  );
}

export default DatasetManagement;
