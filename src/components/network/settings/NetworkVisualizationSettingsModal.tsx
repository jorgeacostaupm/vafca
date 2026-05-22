import { Modal, Tabs } from "antd";
import NetworkGeneralSettingsTab from "./NetworkGeneralSettingsTab";
import PaletteSettingsTab from "./PaletteSettingsTab";
import HierarchySettingsTab from "./HierarchySettingsTab";
import CircularSettingsTab from "./CircularSettingsTab";

type NetworkVisualizationSettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function NetworkVisualizationSettingsModal({
  open,
  onClose,
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
        items={[
          {
            key: "general",
            label: "General",
            children: <NetworkGeneralSettingsTab />,
          },
          {
            key: "palette",
            label: "Palette",
            children: <PaletteSettingsTab />,
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
