import { Modal, Tabs } from "antd";

import AtlasMetadataSummary from "@/components/atlas/AtlasMetadataSummary";
import AtlasUploader from "@/components/atlas/AtlasUploader";
import SettingsSection from "@/components/network/settings/SettingsSection";
import {
  DEFAULT_ATLAS_MANAGEMENT_TAB,
  DEFAULT_ATLAS_MANAGEMENT_MODAL_WIDTH,
  DEFAULT_ATLAS_MODAL_TOP,
} from "@/config/ui";

type AtlasManagementModalProps = {
  open: boolean;
  onClose: () => void;
};

function CurrentAtlasTab() {
  return (
    <SettingsSection
      title="Current atlas"
      description="Review the atlas metadata currently loaded in the workspace."
    >
      <AtlasMetadataSummary />
    </SettingsSection>
  );
}

function ImportAtlasTab() {
  return (
    <SettingsSection
      title="Import atlas"
      description="Replace the current atlas with a compatible atlas JSON file."
    >
      <AtlasUploader />
    </SettingsSection>
  );
}

export default function AtlasManagementModal({
  open,
  onClose,
}: AtlasManagementModalProps) {
  const items = [
    {
      key: "current",
      label: "Current",
      children: <CurrentAtlasTab />,
    },
    {
      key: "import",
      label: "Import",
      children: <ImportAtlasTab />,
    },
  ];

  return (
    <Modal
      title="Atlas data"
      open={open}
      onCancel={onClose}
      footer={null}
      width={DEFAULT_ATLAS_MANAGEMENT_MODAL_WIDTH}
      style={{ top: DEFAULT_ATLAS_MODAL_TOP }}
      className="network-settings-modal atlas-panel__management-modal"
      destroyOnHidden
    >
      <Tabs
        className="atlas-panel__management-tabs"
        defaultActiveKey={DEFAULT_ATLAS_MANAGEMENT_TAB}
        destroyOnHidden
        items={items}
      />
    </Modal>
  );
}
