import { Divider, Modal, Space } from "antd";

import AtlasMetadataSummary from "@/components/atlas/AtlasMetadataSummary";
import AtlasUploader from "@/components/atlas/AtlasUploader";

type AtlasManagementModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AtlasManagementModal({
  open,
  onClose,
}: AtlasManagementModalProps) {
  return (
    <Modal
      title="Upload Atlas"
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      destroyOnHidden
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <AtlasMetadataSummary />
        <Divider style={{ margin: 0 }} />
        <AtlasUploader />
      </Space>
    </Modal>
  );
}
