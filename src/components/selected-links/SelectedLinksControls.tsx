import type { MenuProps } from "antd";
import { Button, Dropdown, Select, Space, Typography } from "antd";
import { useMemo } from "react";

import type {
  DownloadMode,
  NetworkOption,
} from "@/components/selected-links/selectedLinksPanel.types";

type SelectedLinksControlsProps = {
  linksCount: number;
  downloading: boolean;
  onDownload: (mode: DownloadMode) => void;
  onClear: () => void;
  networkOptions: NetworkOption[];
  selectedNetworkIds: string[];
  networkOptionsLoading: boolean;
  loadingNetworks: boolean;
  onSelectedNetworkIdsChange: (ids: string[]) => void;
};

export default function SelectedLinksControls({
  linksCount,
  downloading,
  onDownload,
  onClear,
  networkOptions,
  selectedNetworkIds,
  networkOptionsLoading,
  loadingNetworks,
  onSelectedNetworkIdsChange,
}: SelectedLinksControlsProps) {
  const downloadMenu = useMemo<MenuProps>(
    () => ({
      items: [
        {
          key: "all",
          label: "Download all available networks",
        },
        {
          key: "viewer",
          label: "Download selected networks",
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
        <Typography.Text strong>Additional networks</Typography.Text>
        <Select
          mode="multiple"
          allowClear
          options={networkOptions}
          optionFilterProp="label"
          placeholder="Select networks to show extra values"
          value={selectedNetworkIds}
          loading={networkOptionsLoading}
          style={{ width: "100%" }}
          onChange={(value) => onSelectedNetworkIdsChange(value)}
        />
        {selectedNetworkIds.length > 0 && loadingNetworks ? (
          <Typography.Text type="secondary">
            Loading network values…
          </Typography.Text>
        ) : null}
      </Space>
    </>
  );
}

