import { useState } from "react";
import {
  CalculatorOutlined,
  DatabaseOutlined,
  FilterOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";
import DerivedMatrixCalculationModal from "@/components/calculations/DerivedMatrixCalculationModal";
import DataManagementModal from "@/components/management/DataManagementModal";
import NetworkEdgeFilterModal from "@/components/network/edge-filter/NetworkEdgeFilterModal";
import NetworkVisualizationSettingsModal, {
  type NetworkVisualizationSettingsTabKey,
} from "@/components/network/settings/NetworkVisualizationSettingsModal";
import { DEFAULT_NETWORK_SETTINGS_TAB } from "@/config/ui";
import { getAvailableMatrixCalculations } from "@/connectivity/calculations";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetContent } from "@/store/slices/dataset";

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

type SettingsActionProps = {
  open: boolean;
  activeTab: NetworkVisualizationSettingsTabKey;
  onOpen: () => void;
  onClose: () => void;
  onTabChange: (tab: NetworkVisualizationSettingsTabKey) => void;
};

function SettingsAction({
  open,
  activeTab,
  onOpen,
  onClose,
  onTabChange,
}: SettingsActionProps) {
  return (
    <>
      <Tooltip title="Visualization settings">
        <Button
          aria-label="Visualization settings"
          icon={<SettingOutlined />}
          onClick={onOpen}
        />
      </Tooltip>
      <NetworkVisualizationSettingsModal
        open={open}
        onClose={onClose}
        activeTab={activeTab}
        onTabChange={onTabChange}
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

type ComputeActionProps = {
  onOpenGroupingSettings: () => void;
};

function ComputeAction({ onOpenGroupingSettings }: ComputeActionProps) {
  const datasetContent = useAppSelector(
    (state) => selectDatasetContent(state),
  );
  const [open, setOpen] = useState(false);
  const calculationAvailable =
    datasetContent && getAvailableMatrixCalculations(datasetContent).length > 0;

  return (
    <>
      <Tooltip
        title={
          calculationAvailable
            ? "Compute derived networks from the loaded dataset data"
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
        onOpenGroupingSettings={() => {
          setOpen(false);
          onOpenGroupingSettings();
        }}
      />
    </>
  );
}

export default function NetworkSelectorActions() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] =
    useState<NetworkVisualizationSettingsTabKey>(DEFAULT_NETWORK_SETTINGS_TAB);

  const openSettings = (
    tab: NetworkVisualizationSettingsTabKey = DEFAULT_NETWORK_SETTINGS_TAB,
  ) => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  return (
    <div className="network-action-toolbar" aria-label="Network tools">
      <Space size={6}>
        <DataAction />
        <ComputeAction onOpenGroupingSettings={() => openSettings("grouping")} />
        <FilterAction />
        <SettingsAction
          open={settingsOpen}
          activeTab={settingsTab}
          onOpen={() => openSettings(DEFAULT_NETWORK_SETTINGS_TAB)}
          onClose={() => setSettingsOpen(false)}
          onTabChange={setSettingsTab}
        />
      </Space>
    </div>
  );
}
