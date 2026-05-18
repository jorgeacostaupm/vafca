import { useState } from "react";
import {
  CalculatorOutlined,
  DatabaseOutlined,
  FilterOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";
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
      <Button icon={<DatabaseOutlined />} onClick={() => setOpen(true)}>
        Data
      </Button>
      <DataManagementModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SettingsAction() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button icon={<SettingOutlined />} onClick={() => setOpen(true)}>
        Settings
      </Button>
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
      <Button icon={<FilterOutlined />} onClick={() => setOpen(true)}>
        Filter
      </Button>
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
          icon={<CalculatorOutlined />}
          disabled={!calculationAvailable}
          onClick={() => setOpen(true)}
        >
          Compute
        </Button>
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
    <>
      <DataAction />
      <SettingsAction />
      <FilterAction />
      <ComputeAction />
    </>
  );
}
