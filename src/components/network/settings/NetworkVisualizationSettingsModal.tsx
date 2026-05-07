import { Modal, Tabs } from "antd";
import PaletteSettingsTab from "./PaletteSettingsTab";
import HierarchySettingsTab from "./HierarchySettingsTab";

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
            key: "palette",
            label: "Palette",
            children: <PaletteSettingsTab />,
          },
          {
            key: "circular",
            label: "Circular",
            children: <HierarchySettingsTab mode="circular" />,
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
