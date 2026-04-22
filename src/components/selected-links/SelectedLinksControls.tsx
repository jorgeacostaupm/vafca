import { Button, Dropdown, Select, Space, Typography } from "antd";
import { useMemo } from "react";
import type { MenuProps } from "antd";
import type {
  DownloadMode,
  MatrixOption,
} from "@/components/selected-links/selectedLinksPanel.types";

type SelectedLinksControlsProps = {
  linksCount: number;
  downloading: boolean;
  onDownload: (mode: DownloadMode) => void;
  onClear: () => void;
  matrixOptions: MatrixOption[];
  selectedMatrixIds: string[];
  matrixOptionsLoading: boolean;
  loadingMatrices: boolean;
  onSelectedMatrixIdsChange: (ids: string[]) => void;
};

export default function SelectedLinksControls({
  linksCount,
  downloading,
  onDownload,
  onClear,
  matrixOptions,
  selectedMatrixIds,
  matrixOptionsLoading,
  loadingMatrices,
  onSelectedMatrixIdsChange,
}: SelectedLinksControlsProps) {
  const downloadMenu = useMemo<MenuProps>(
    () => ({
      items: [
        {
          key: "all",
          label: "Download all available matrices",
        },
        {
          key: "viewer",
          label: "Download selected matrices",
        },
      ],
      onClick: ({ key }) => {
        if (key !== "all" && key !== "viewer") return;
        onDownload(key);
      },
    }),
    [onDownload],
  );

  return (
    <>
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Selected links
        </Typography.Title>
        <Space size={8}>
          <Dropdown menu={downloadMenu} trigger={["click"]}>
            <Button disabled={linksCount === 0} loading={downloading}>
              Download links
            </Button>
          </Dropdown>
          <Button onClick={onClear} disabled={linksCount === 0}>
            Clear
          </Button>
        </Space>
      </Space>
      <Typography.Text type="secondary">
        Select links in the table to highlight them in the atlas.
      </Typography.Text>
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <Typography.Text strong>Additional matrices</Typography.Text>
        <Select
          mode="multiple"
          allowClear
          options={matrixOptions}
          optionFilterProp="label"
          placeholder="Select matrices to show extra values"
          value={selectedMatrixIds}
          loading={matrixOptionsLoading}
          style={{ width: "100%" }}
          onChange={(value) => onSelectedMatrixIdsChange(value)}
        />
        {selectedMatrixIds.length > 0 && loadingMatrices ? (
          <Typography.Text type="secondary">
            Loading matrix values…
          </Typography.Text>
        ) : null}
      </Space>
    </>
  );
}

