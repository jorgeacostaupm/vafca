import {
  CalculatorOutlined,
  DatabaseOutlined,
  FilterOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";
import { useState } from "react";

import DerivedMatrixCalculationModal, {
  type DerivedMatrixCalculationTab,
} from "@/components/calculations/DerivedMatrixCalculationModal";
import DataManagementModal from "@/components/management/DataManagementModal";
import NetworkEdgeFilterModal from "@/components/network/edge-filter/NetworkEdgeFilterModal";
import NetworkVisualizationSettingsModal, {
  type NetworkVisualizationSettingsTabKey,
} from "@/components/network/settings/NetworkVisualizationSettingsModal";
import { DEFAULT_NETWORK_SETTINGS_TAB } from "@/config/ui";
import { getAvailableMatrixCalculations } from "@/networkDerivation/calculations";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetContent } from "@/store/slices/dataset";

type DataActionProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

function DataAction({ open, onOpen, onClose }: DataActionProps) {
  return (
    <>
      <Tooltip title="Manage loaded datasets and matrix metadata">
        <Button
          aria-label="Manage data"
          icon={<DatabaseOutlined />}
          onClick={onOpen}
        />
      </Tooltip>
      <DataManagementModal open={open} onClose={onClose} />
    </>
  );
}

type SettingsActionProps = {
  open: boolean;
  activeTab: NetworkVisualizationSettingsTabKey;
  onOpenAggregationModal: () => void;
  onOpen: () => void;
  onClose: () => void;
  onTabChange: (tab: NetworkVisualizationSettingsTabKey) => void;
};

function SettingsAction({
  open,
  activeTab,
  onOpenAggregationModal,
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
        onOpenAggregationModal={onOpenAggregationModal}
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
  open: boolean;
  initialTab: DerivedMatrixCalculationTab;
  onOpen: () => void;
  onClose: () => void;
  onOpenGroupingSettings: () => void;
};

function ComputeAction({
  open,
  initialTab,
  onOpen,
  onClose,
  onOpenGroupingSettings,
}: ComputeActionProps) {
  const datasetContent = useAppSelector(
    (state) => selectDatasetContent(state),
  );
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
          onClick={onOpen}
        />
      </Tooltip>
      {open ? (
        <DerivedMatrixCalculationModal
          open={open}
          initialTab={initialTab}
          onClose={onClose}
          onOpenGroupingSettings={() => {
            onClose();
            onOpenGroupingSettings();
          }}
        />
      ) : null}
    </>
  );
}

export default function NetworkSelectorActions() {
  const [dataOpen, setDataOpen] = useState(false);
  const [computeOpen, setComputeOpen] = useState(false);
  const [computeInitialTab, setComputeInitialTab] =
    useState<DerivedMatrixCalculationTab>("comparison");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] =
    useState<NetworkVisualizationSettingsTabKey>(DEFAULT_NETWORK_SETTINGS_TAB);

  const openSettings = (
    tab: NetworkVisualizationSettingsTabKey = DEFAULT_NETWORK_SETTINGS_TAB,
  ) => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  const openComputeModal = (tab: DerivedMatrixCalculationTab = "comparison") => {
    setComputeInitialTab(tab);
    setComputeOpen(true);
  };

  const openAggregationModal = () => {
    setSettingsOpen(false);
    openComputeModal("aggregated");
  };

  return (
    <div className="network-action-toolbar" aria-label="Network tools">
      <Space size={6}>
        <DataAction
          open={dataOpen}
          onOpen={() => setDataOpen(true)}
          onClose={() => setDataOpen(false)}
        />
        <ComputeAction
          open={computeOpen}
          initialTab={computeInitialTab}
          onOpen={() => openComputeModal("comparison")}
          onClose={() => setComputeOpen(false)}
          onOpenGroupingSettings={() => openSettings("grouping")}
        />
        <FilterAction />
        <SettingsAction
          open={settingsOpen}
          activeTab={settingsTab}
          onOpenAggregationModal={openAggregationModal}
          onOpen={() => openSettings(DEFAULT_NETWORK_SETTINGS_TAB)}
          onClose={() => setSettingsOpen(false)}
          onTabChange={setSettingsTab}
        />
      </Space>
    </div>
  );
}
