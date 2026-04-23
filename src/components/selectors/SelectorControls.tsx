import { Button, Form, Select, Space, Typography } from "antd";
import { useNetworkSelectorModel } from "@/components/network/useNetworkSelectorModel";
import type { NetworkViewType } from "@/types/networkVisualization";

export default function SelectorControls() {
  const {
    controls,
    status,
    error,
    measures,
    populations,
    bands,
    stats,
    matrices,
    showMatrixSelect,
    disabled,
    onViewTypeChange,
    onPopulationChange,
    onMeasureChange,
    onStatChange,
    onBandChange,
    onMatrixChange,
    onAddView,
  } = useNetworkSelectorModel();

  if (status === "loading") {
    return <Typography.Text>Loading matrix list…</Typography.Text>;
  }

  if (status === "error") {
    return <Typography.Text type="danger">Error: {error}</Typography.Text>;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Typography.Text type="secondary">
        Select populations, measure, statistic, and band.
      </Typography.Text>

      <Form layout="vertical">
        <Form.Item label="View type">
          <Select
            value={controls.viewType}
            onChange={(value) => onViewTypeChange(value as NetworkViewType)}
            options={[
              { value: "matrix", label: "Matrix" },
              { value: "circular", label: "Circular" },
              { value: "classic", label: "Node-Link" },
            ]}
          />
        </Form.Item>

        <Form.Item label="Populations">
          <Select
            placeholder="Select populations..."
            value={controls.populationKey || undefined}
            onChange={onPopulationChange}
            allowClear
            options={populations}
          />
        </Form.Item>

        <Form.Item label="Measure">
          <Select
            placeholder="Select a measure..."
            value={controls.measureId || undefined}
            onChange={onMeasureChange}
            allowClear
            disabled={disabled.measures}
            options={measures}
          />
        </Form.Item>

        <Form.Item label="Statistic">
          <Select
            placeholder="Select a statistic..."
            value={controls.statId || undefined}
            onChange={onStatChange}
            allowClear
            disabled={disabled.stats}
            options={stats}
          />
        </Form.Item>

        <Form.Item label="Band">
          <Select
            placeholder="Select a band..."
            value={controls.bandId || undefined}
            onChange={onBandChange}
            allowClear
            disabled={disabled.bands}
            options={bands}
          />
        </Form.Item>

        {showMatrixSelect && (
          <Form.Item label="Matrix">
            <Select
              placeholder="Select a matrix..."
              value={controls.selectedCompoundId || undefined}
              onChange={onMatrixChange}
              allowClear
              options={matrices}
            />
          </Form.Item>
        )}

        <Button
          type="primary"
          onClick={onAddView}
          disabled={!controls.selectedCompoundId}
        >
          Add view to layout
        </Button>
      </Form>
    </Space>
  );
}
