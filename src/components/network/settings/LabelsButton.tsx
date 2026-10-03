import { TagsOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import { useState } from 'react'

import { DEFAULT_LABELS_MODAL_WIDTH } from '@/config/ui'

import GroupingSettingsTab from './GroupingSettingsTab'

export default function LabelsButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        icon={<TagsOutlined />}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        Labels
      </Button>
      <Modal
        title="Labels"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={DEFAULT_LABELS_MODAL_WIDTH}
        className="network-settings-modal"
        destroyOnHidden
      >
        <GroupingSettingsTab />
      </Modal>
    </>
  )
}
