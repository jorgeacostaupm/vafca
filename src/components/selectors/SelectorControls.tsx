import {
  ApartmentOutlined,
  AppstoreOutlined,
  BranchesOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Form, Segmented, Select, Typography } from "antd";
import type React from "react";
import { useNetworkSelectorModel } from "@/components/network/useNetworkSelectorModel";
import type { NetworkViewType } from "@/types/networkVisualization";

const viewTypeOptions: Array<{
  value: NetworkViewType;
  label: React.ReactNode;
}> = [
  {
    value: "matrix",
    label: (
      <span className="network-view-type-option">
        <AppstoreOutlined />
        Matrix
      </span>
    ),
  },
  {
    value: "circular",
    label: (
      <span className="network-view-type-option">
        <ApartmentOutlined />
        Circular
      </span>
    ),
  },
  {
    value: "classic",
    label: (
      <span className="network-view-type-option">
        <BranchesOutlined />
        Node-Link
      </span>
    ),
  },
];

const viewTypeActionLabel: Record<NetworkViewType, string> = {
  matrix: "Add network",
  circular: "Add circular view",
  classic: "Add node-link view",
};

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
    return (
      <Typography.Text className="network-selector-controls__status">
        Loading matrix list…
      </Typography.Text>
    );
  }

  if (status === "error") {
    return (
      <Typography.Text
        className="network-selector-controls__status"
        type="danger"
      >
        Error: {error}
      </Typography.Text>
    );
  }

  return (
    <Form className="network-selector-controls" layout="vertical">
      <div className="network-selector-controls__filter-grid">
        <Form.Item label="View type" className="network-selector-controls__view-type">
          <Segmented
            value={controls.viewType}
            onChange={(value) => onViewTypeChange(value as NetworkViewType)}
            options={viewTypeOptions}
          />
        </Form.Item>
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

        <Form.Item label="Band">
          <Select
            placeholder="Select band..."
            value={controls.bandId || undefined}
            onChange={onBandChange}
            allowClear
            disabled={disabled.bands}
            options={bands}
          />
        </Form.Item>
      </div>

      <div className="network-selector-controls__matrix-row">
        <Form.Item label="Network" className="network-selector-controls__matrix">
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

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddView}
          disabled={!controls.selectedCompoundId}
          className="network-selector-controls__add"
        >
          {viewTypeActionLabel[controls.viewType]}
        </Button>
      </div>
    </Form>
  );
}
