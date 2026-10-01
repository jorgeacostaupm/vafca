import { Modal } from 'antd'

import AtlasPanelGroupingControls from '@/components/atlas/AtlasPanelGroupingControls'
import {
  DEFAULT_ATLAS_MANAGEMENT_MODAL_WIDTH,
  DEFAULT_ATLAS_MODAL_TOP,
} from '@/config/ui'

type AtlasManagementModalProps = {
  open: boolean
  onClose: () => void
}

export default function AtlasManagementModal({ open, onClose }: AtlasManagementModalProps) {
  return (
    <Modal
      title="Define Groups"
      open={open}
      onCancel={onClose}
      footer={null}
      width={DEFAULT_ATLAS_MANAGEMENT_MODAL_WIDTH}
      style={{ top: DEFAULT_ATLAS_MODAL_TOP }}
      className="network-settings-modal atlas-panel__management-modal"
      destroyOnHidden
    >
      <AtlasPanelGroupingControls />
    </Modal>
  )
}
