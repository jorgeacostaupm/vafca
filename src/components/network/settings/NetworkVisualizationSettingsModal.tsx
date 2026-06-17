import { Modal, Tabs } from "antd";

import {
  DEFAULT_NETWORK_SETTINGS_MODAL_TOP,
  DEFAULT_NETWORK_SETTINGS_MODAL_WIDTH,
  DEFAULT_NETWORK_SETTINGS_TAB,
} from "@/config/ui";

import CircularSettingsTab from "./CircularSettingsTab";
import GroupingSettingsTab from "./GroupingSettingsTab";
import MatrixSettingsTab from "./MatrixSettingsTab";
import NetworkRankingsSettingsTab from "./NetworkRankingsSettingsTab";
import NetworkViewsSettingsTab from "./NetworkViewsSettingsTab";

export type NetworkVisualizationSettingsTabKey =
  | "networks"
  | "rankings"
  | "grouping"
  | "circular"
  | "matrices";

type NetworkVisualizationSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  onOpenAggregationModal?: () => void;
  activeTab?: NetworkVisualizationSettingsTabKey;
  onTabChange?: (tab: NetworkVisualizationSettingsTabKey) => void;
};

export default function NetworkVisualizationSettingsModal({
  open,
  onClose,
  onOpenAggregationModal,
  activeTab,
  onTabChange,
}: NetworkVisualizationSettingsModalProps) {
  const currentTab = activeTab ?? DEFAULT_NETWORK_SETTINGS_TAB;

  return (
    <Modal
      title="Visualization settings"
      open={open}
      onCancel={onClose}
      footer={null}
      width={DEFAULT_NETWORK_SETTINGS_MODAL_WIDTH}
      style={{ top: DEFAULT_NETWORK_SETTINGS_MODAL_TOP }}
      className="network-settings-modal"
      forceRender
    >
      <Tabs
        activeKey={currentTab}
        destroyOnHidden
        onChange={(key) => onTabChange?.(key as NetworkVisualizationSettingsTabKey)}
        items={[
          {
            key: "networks",
            label: "Networks",
            children: <NetworkViewsSettingsTab />,
          },
          {
            key: "rankings",
            label: "Rankings",
            children: <NetworkRankingsSettingsTab />,
          },
          {
            key: "grouping",
            label: "Grouping",
            children: (
              <GroupingSettingsTab onOpenAggregationModal={onOpenAggregationModal} />
            ),
          },
          {
            key: "circular",
            label: "Node-Link",
            children: <CircularSettingsTab />,
          },
          {
            key: "matrices",
            label: "Matrices",
            children: <MatrixSettingsTab />,
          },
        ]}
      />
    </Modal>
  );
}
