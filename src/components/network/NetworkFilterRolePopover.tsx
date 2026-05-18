import { Divider, Form, Space, Switch, Typography } from "antd";
import DebouncedRangeSlider from "@/components/common/DebouncedRangeSlider";
import type {
  MatrixNetworkViewSettings,
  NodeLinkNetworkViewSettings,
} from "@/types/networkVisualization";

type NetworkFilterRolePopoverProps = {
  statRangeValue?:
    | MatrixNetworkViewSettings["statRange"]
    | NodeLinkNetworkViewSettings["statRange"];
  hasNegativeRange: boolean;
  statSliderMin: number;
  statSliderMax: number;
  onStatRangeChange: (
    value: [number, number],
    segment?: "negative" | "positive",
  ) => void;
  useAsNodeFilter: boolean;
  onUseAsNodeFilterChange: (checked: boolean) => void;
  useAsLinkFilter: boolean;
  onUseAsLinkFilterChange: (checked: boolean) => void;
};

export default function NetworkFilterRolePopover({
  statRangeValue,
  hasNegativeRange,
  statSliderMin,
  statSliderMax,
  onStatRangeChange,
  useAsNodeFilter,
  onUseAsNodeFilterChange,
  useAsLinkFilter,
  onUseAsLinkFilterChange,
}: NetworkFilterRolePopoverProps) {
  return (
    <Space direction="vertical" size={12} style={{ width: 280 }}>
      <Typography.Text strong>Range filter</Typography.Text>
      {statRangeValue ? (
        hasNegativeRange ? (
          <>
            <Form.Item label="Negative range">
              <DebouncedRangeSlider
                range
                min={statSliderMin}
                max={0}
                step={0.001}
                value={
                  statRangeValue && !Array.isArray(statRangeValue)
                    ? statRangeValue.negative
                    : [statSliderMin, 0]
                }
                onChange={(value) => {
                  if (Array.isArray(value)) {
                    onStatRangeChange(value as [number, number], "negative");
                  }
                }}
                tooltip={{ formatter: (value) => value?.toFixed(3) }}
              />
            </Form.Item>
            <Form.Item label="Positive range">
              <DebouncedRangeSlider
                range
                min={0}
                max={Math.max(statSliderMax, 0)}
                step={0.001}
                value={
                  statRangeValue && !Array.isArray(statRangeValue)
                    ? statRangeValue.positive
                    : [0, Math.max(statSliderMax, 0)]
                }
                onChange={(value) => {
                  if (Array.isArray(value)) {
                    onStatRangeChange(value as [number, number], "positive");
                  }
                }}
                tooltip={{ formatter: (value) => value?.toFixed(3) }}
              />
            </Form.Item>
          </>
        ) : (
          <Form.Item label="Range">
            <DebouncedRangeSlider
              range
              min={statSliderMin}
              max={Math.max(statSliderMax, 0)}
              step={0.001}
              value={
                statRangeValue && Array.isArray(statRangeValue)
                  ? statRangeValue
                  : [statSliderMin, statSliderMax]
              }
              onChange={(value) => {
                if (Array.isArray(value)) {
                  onStatRangeChange(value as [number, number]);
                }
              }}
              tooltip={{ formatter: (value) => value?.toFixed(3) }}
            />
          </Form.Item>
        )
      ) : (
        <Typography.Text type="secondary">No range available.</Typography.Text>
      )}
      <Divider style={{ margin: "8px 0" }} />
      <Form.Item label="Use as node filter" valuePropName="checked">
        <Switch
          checked={useAsNodeFilter}
          onChange={(checked) => onUseAsNodeFilterChange(checked)}
        />
      </Form.Item>
      <Form.Item label="Use as link filter" valuePropName="checked">
        <Switch
          checked={useAsLinkFilter}
          onChange={(checked) => onUseAsLinkFilterChange(checked)}
        />
      </Form.Item>
    </Space>
  );
}
