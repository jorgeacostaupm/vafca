import { DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Dropdown, Select, Space, Tooltip, Typography } from "antd";
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
    <div className="links-controls">
      <div className="links-controls__header">
        <Space direction="vertical" size={2}>
          <Typography.Title level={4} className="links-controls__title">
            Selected links
          </Typography.Title>
          <Typography.Text type="secondary">
            Select links in the table to highlight them in the atlas.
          </Typography.Text>
        </Space>
        <div className="network-action-toolbar" aria-label="Selected links tools">
          <Space size={6}>
            <Tooltip title="Download selected links">
              <Dropdown menu={downloadMenu} trigger={["click"]}>
                <Button
                  aria-label="Download selected links"
                  disabled={linksCount === 0}
                  icon={<DownloadOutlined />}
                  loading={downloading}
                />
              </Dropdown>
            </Tooltip>
            <Tooltip title="Clear selected links">
              <Button
                aria-label="Clear selected links"
                disabled={linksCount === 0}
                icon={<DeleteOutlined />}
                onClick={onClear}
              />
            </Tooltip>
          </Space>
        </div>
      </div>
      <Space direction="vertical" size={6} className="links-controls__network-picker">
        <Typography.Text strong>Additional networks</Typography.Text>
        <Select
          mode="multiple"
          allowClear
          options={networkOptions}
          optionFilterProp="label"
          placeholder="Select networks to show extra values"
          value={selectedNetworkIds}
          loading={networkOptionsLoading}
          className="links-controls__network-select"
          onChange={(value) => onSelectedNetworkIdsChange(value)}
        />
        {selectedNetworkIds.length > 0 && loadingNetworks ? (
          <Typography.Text type="secondary">
            Loading network values…
          </Typography.Text>
        ) : null}
      </Space>
    </div>
  );
}
