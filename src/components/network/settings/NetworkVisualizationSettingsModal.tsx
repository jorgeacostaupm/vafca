import { Modal, Tabs } from "antd";
import NetworkViewsSettingsTab from "./NetworkViewsSettingsTab";
import NetworkRankingsSettingsTab from "./NetworkRankingsSettingsTab";
import GroupingSettingsTab from "./GroupingSettingsTab";
import HierarchySettingsTab from "./HierarchySettingsTab";
import CircularSettingsTab from "./CircularSettingsTab";
import { DEFAULT_NETWORK_SETTINGS_TAB } from "@/config/ui";

export type NetworkVisualizationSettingsTabKey =
  | "views"
  | "rankings"
  | "grouping"
  | "circular"
  | "matrices";

type NetworkVisualizationSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  activeTab?: NetworkVisualizationSettingsTabKey;
  onTabChange?: (tab: NetworkVisualizationSettingsTabKey) => void;
};

export default function NetworkVisualizationSettingsModal({
  open,
  onClose,
  activeTab,
  onTabChange,
}: NetworkVisualizationSettingsModalProps) {
  return (
    <Modal
      title="Visualization settings"
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      destroyOnHidden
    >
      <Tabs
        activeKey={activeTab ?? DEFAULT_NETWORK_SETTINGS_TAB}
        onChange={(key) => onTabChange?.(key as NetworkVisualizationSettingsTabKey)}
        items={[
          {
            key: "views",
            label: "Views",
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
            children: <GroupingSettingsTab />,
          },
          {
            key: "circular",
            label: "Circular",
            children: <CircularSettingsTab />,
          },
          {
            key: "matrices",
            label: "Matrices",
            children: <HierarchySettingsTab mode="matrix" />,
          },
        ]}
      />
    </Modal>
  );
}
