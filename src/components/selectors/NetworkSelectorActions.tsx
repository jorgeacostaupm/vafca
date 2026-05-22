import { useState } from "react";
import {
  CalculatorOutlined,
  DatabaseOutlined,
  FilterOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Space, Tooltip, Typography } from "antd";
import DerivedMatrixCalculationModal from "@/components/calculations/DerivedMatrixCalculationModal";
import DataManagementModal from "@/components/management/DataManagementModal";
import NetworkEdgeFilterModal from "@/components/network/edge-filter/NetworkEdgeFilterModal";
import NetworkVisualizationSettingsModal from "@/components/network/settings/NetworkVisualizationSettingsModal";
import { getAvailableMatrixCalculations } from "@/connectivity/calculations";
import { useAppSelector } from "@/store/hooks";

function DataAction() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Manage loaded datasets and matrix metadata">
        <Button
          aria-label="Manage data"
          icon={<DatabaseOutlined />}
          onClick={() => setOpen(true)}
        />
      </Tooltip>
      <DataManagementModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SettingsAction() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Visualization settings">
        <Button
          aria-label="Visualization settings"
          icon={<SettingOutlined />}
          onClick={() => setOpen(true)}
        />
      </Tooltip>
      <NetworkVisualizationSettingsModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function FilterAction() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Configure edge filters">
        <Button
          aria-label="Configure edge filters"
          icon={<FilterOutlined />}
          onClick={() => setOpen(true)}
        />
      </Tooltip>
      <NetworkEdgeFilterModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ComputeAction() {
  const connectivity = useAppSelector(
    (state) => state.dataset.data?.connectivity,
  );
  const [open, setOpen] = useState(false);
  const calculationAvailable =
    connectivity && getAvailableMatrixCalculations(connectivity).length > 0;

  return (
    <>
      <Tooltip
        title={
          calculationAvailable
            ? undefined
            : "No derived matrix calculations are available with the currently loaded data."
        }
      >
        <Button
          aria-label="Compute derived matrices"
          icon={<CalculatorOutlined />}
          disabled={!calculationAvailable}
          onClick={() => setOpen(true)}
        />
      </Tooltip>
      <DerivedMatrixCalculationModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export default function NetworkSelectorActions() {
  return (
    <div className="network-action-toolbar" aria-label="Network tools">
      <Space size={6}>
        <Typography.Text type="secondary" className="network-action-toolbar__label">
          Data
        </Typography.Text>
        <DataAction />
        <ComputeAction />
      </Space>
      <Space size={6}>
        <Typography.Text type="secondary" className="network-action-toolbar__label">
          Visualization
        </Typography.Text>
        <FilterAction />
        <SettingsAction />
      </Space>
    </div>
  );
}
