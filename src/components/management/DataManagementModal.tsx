import { Button, Modal, Space, Tabs, Typography } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { downloadCurrentDataset } from "@/store/slices/dataset";
import CatalogManagementSections from "@/components/management/components/catalogs/CatalogManagementSections";
import DatasetSummaryHeader from "@/components/management/components/DatasetSummaryHeader";
import MatrixSummarySection from "@/components/management/components/MatrixSummarySection";
import MatrixUploader from "@/components/management/components/MatrixUploader";

interface DataManagementModalProps {
  open: boolean;
  onClose: () => void;
}

function DataLoadingTab() {
  const dispatch = useAppDispatch();
  const { data, downloadStatus } = useAppSelector((state) => state.dataset);
  const metadata = data
    ? [
        { label: "Populations", value: Object.keys(data.catalogs.populations).length },
        { label: "Measures", value: Object.keys(data.catalogs.measures).length },
        { label: "Statistics", value: Object.keys(data.catalogs.stats).length },
        { label: "Bands", value: Object.keys(data.catalogs.bands).length },
      ]
    : [];

  const handleDownload = () => {
    void dispatch(downloadCurrentDataset());
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <MatrixUploader />

      {data ? (
        <>
          <DatasetSummaryHeader />
          <Space wrap size={16}>
            {metadata.map((item) => (
              <Space key={item.label} size={6}>
                <Typography.Text strong>{item.label}:</Typography.Text>
                <Typography.Text type="secondary">{item.value}</Typography.Text>
              </Space>
            ))}
          </Space>
          <MatrixSummarySection />
          <Button
            size="small"
            onClick={handleDownload}
            loading={downloadStatus === "loading"}
          >
            Download dataset as JSON
          </Button>
        </>
      ) : (
        <Typography.Text type="secondary">No dataset loaded yet.</Typography.Text>
      )}
    </Space>
  );
}

function DataCatalogsTab() {
  const data = useAppSelector((state) => state.dataset.data);

  if (!data) {
    return <Typography.Text type="secondary">Load a dataset to edit catalogs.</Typography.Text>;
  }

  return <CatalogManagementSections />;
}

function DataManagementModal({ open, onClose }: DataManagementModalProps) {
  const { status, error } = useAppSelector((state) => state.dataset);

  const items = [
    {
      key: "load",
      label: "Load data",
      children:
        status === "loading" ? (
          <Typography.Text>Loading dataset...</Typography.Text>
        ) : status === "error" ? (
          <Typography.Text type="danger">Error: {error}</Typography.Text>
        ) : (
          <DataLoadingTab />
        ),
    },
    {
      key: "catalogs",
      label: "Catalogs",
      children: <DataCatalogsTab />,
    },
  ];

  return (
    <Modal
      title="Data"
      open={open}
      onCancel={onClose}
      footer={null}
      width={980}
      destroyOnHidden
    >
      <Tabs items={items} />
    </Modal>
  );
}

export default DataManagementModal;
