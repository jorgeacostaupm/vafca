import {
  Button,
  Divider,
  Form,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { useState } from "react";

import {
  DEFAULT_NETWORK_PERCENT_ZOOM_PERCENT,
  MAX_NETWORK_PERCENT_ZOOM_PERCENT,
  MIN_NETWORK_PERCENT_ZOOM_PERCENT,
} from "@/config/ui";
import type {
  MatrixNetworkViewSettings,
  NetworkPercentFilterMode,
  NetworkPercentLinkFilter,
  NodeLinkNetworkViewSettings,
} from "@/types/networkVisualization";

import NetworkRangeFilter from "./NetworkRangeFilter";

type NetworkFilterRolePopoverProps = {
  statRangeValue?:
    | MatrixNetworkViewSettings["statRange"]
    | NodeLinkNetworkViewSettings["statRange"];
  hasNegativeRange: boolean;
  statCenter: number;
  statSliderMin: number;
  statSliderMax: number;
  onStatRangeChange: (
    value: [number, number],
    segment?: "negative" | "positive",
    enabled?: boolean,
  ) => void;
  useAsNodeFilter: boolean;
  onUseAsNodeFilterChange: (checked: boolean) => void;
  useAsLinkFilter: boolean;
  onUseAsLinkFilterChange: (checked: boolean) => void;
  percentLinkFilter: NetworkPercentLinkFilter | null;
  includeAutoconnections: boolean;
  onPercentLinkFilterChange: (filter: NetworkPercentLinkFilter | null) => void;
};

const percentModeOptions: { value: NetworkPercentFilterMode; label: string }[] = [
  { value: "top", label: "Top links" },
  { value: "bottom", label: "Bottom links" },
  { value: "absoluteTop", label: "Absolute top" },
  { value: "absoluteBottom", label: "Absolute bottom" },
];

const clampPercent = (value: number | null | undefined) =>
  Math.min(
    Math.max(
      value ?? DEFAULT_NETWORK_PERCENT_ZOOM_PERCENT,
      MIN_NETWORK_PERCENT_ZOOM_PERCENT,
    ),
    MAX_NETWORK_PERCENT_ZOOM_PERCENT,
  );

export default function NetworkFilterRolePopover({
  statRangeValue,
  hasNegativeRange,
  statCenter,
  statSliderMin,
  statSliderMax,
  onStatRangeChange,
  useAsNodeFilter,
  onUseAsNodeFilterChange,
  useAsLinkFilter,
  onUseAsLinkFilterChange,
  percentLinkFilter,
  includeAutoconnections,
  onPercentLinkFilterChange,
}: NetworkFilterRolePopoverProps) {
  const [draftPercentMode, setDraftPercentMode] =
    useState<NetworkPercentFilterMode>(percentLinkFilter?.mode ?? "top");
  const [draftPercent, setDraftPercent] = useState(
    clampPercent(percentLinkFilter?.percent),
  );

  const applyPercentFilter = () =>
    onPercentLinkFilterChange({
      mode: draftPercentMode,
      percent: draftPercent,
      includeAutoconnections,
    });

  return (
    <Space direction="vertical" size={12} style={{ width: 280 }}>
      <Typography.Text strong>Range filter</Typography.Text>
      <NetworkRangeFilter
        value={statRangeValue}
        split={hasNegativeRange}
        center={statCenter}
        min={statSliderMin}
        max={statSliderMax}
        onChange={onStatRangeChange}
      />
      <Divider style={{ margin: "8px 0" }} />
      <Typography.Text strong>Percent link filter</Typography.Text>
      <Form.Item label="Mode">
        <Select
          value={draftPercentMode}
          options={percentModeOptions}
          onChange={setDraftPercentMode}
        />
      </Form.Item>
      <Form.Item label="Link percent">
        <InputNumber
          min={MIN_NETWORK_PERCENT_ZOOM_PERCENT}
          max={MAX_NETWORK_PERCENT_ZOOM_PERCENT}
          value={draftPercent}
          addonAfter="%"
          onChange={(value) => setDraftPercent(clampPercent(value))}
        />
      </Form.Item>
      <Space>
        <Button type="primary" size="small" onClick={applyPercentFilter}>
          Apply percent
        </Button>
        {percentLinkFilter ? (
          <Button size="small" onClick={() => onPercentLinkFilterChange(null)}>
            Clear
          </Button>
        ) : null}
      </Space>
      <Divider style={{ margin: "8px 0" }} />
      <Form.Item label="Node filter" valuePropName="checked">
        <Switch
          checked={useAsNodeFilter}
          onChange={(checked) => onUseAsNodeFilterChange(checked)}
        />
      </Form.Item>
      <Form.Item label="Link filter" valuePropName="checked">
        <Switch
          checked={useAsLinkFilter}
          onChange={(checked) => onUseAsLinkFilterChange(checked)}
        />
      </Form.Item>
    </Space>
  );
}
