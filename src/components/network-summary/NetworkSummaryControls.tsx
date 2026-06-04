import { SettingOutlined } from "@ant-design/icons";
import { Button, Form, Select, Typography } from "antd";

import { useNetworkSummarySelectorModel } from "@/components/network-summary/useNetworkSummarySelectorModel";

type Props = {
  onOpenSettings: () => void;
};

export default function NetworkSummaryControls({ onOpenSettings }: Props) {
  const {
    controls,
    status,
    error,
    measures,
    populations,
    layers,
    stats,
    matrices,
    disabled,
    onPopulationChange,
    onMeasureChange,
    onStatChange,
    onLayerChange,
    onMatrixChange,
  } = useNetworkSummarySelectorModel();

  if (status === "loading") {
    return (
      <Typography.Text className="network-summary-controls__status">
        Loading matrix list...
      </Typography.Text>
    );
  }

  if (status === "error") {
    return (
      <Typography.Text
        className="network-summary-controls__status"
        type="danger"
      >
        Error: {error}
      </Typography.Text>
    );
  }

  const settingsButton = (
    <Button icon={<SettingOutlined />} onClick={onOpenSettings}>
      Settings
    </Button>
  );

  return (
    <Form
      className={`network-summary-controls network-selector-controls network-selector-controls--${controls.matrixSelectorMode}`}
      layout="vertical"
    >
      {controls.matrixSelectorMode === "combined" ? (
        <div className="network-summary-controls__matrix-row">
          <Form.Item label="Network" className="network-summary-controls__matrix">
            <Select
              placeholder="Select network..."
              value={controls.selectedCompoundId || undefined}
              onChange={onMatrixChange}
              allowClear
              showSearch
              optionFilterProp="label"
              options={matrices}
            />
          </Form.Item>
          {settingsButton}
        </div>
      ) : (
        <div className="network-summary-controls__filter-grid">
          <Form.Item label="Population">
            <Select
              placeholder="Select population..."
              value={controls.populationKey || undefined}
              onChange={onPopulationChange}
              allowClear
              options={populations}
            />
          </Form.Item>

          <Form.Item label="Measure">
            <Select
              placeholder="Select measure..."
              value={controls.measureId || undefined}
              onChange={onMeasureChange}
              allowClear
              disabled={disabled.measures}
              options={measures}
            />
          </Form.Item>

          <Form.Item label="Statistic">
            <Select
              placeholder="Select statistic..."
              value={controls.statId || undefined}
              onChange={onStatChange}
              allowClear
              disabled={disabled.stats}
              options={stats}
            />
          </Form.Item>

          <Form.Item label="Layer">
            <Select
              placeholder="Select layer..."
              value={controls.layerId || undefined}
              onChange={onLayerChange}
              allowClear
              disabled={disabled.layers}
              options={layers}
            />
          </Form.Item>

          {settingsButton}
        </div>
      )}
    </Form>
  );
}
