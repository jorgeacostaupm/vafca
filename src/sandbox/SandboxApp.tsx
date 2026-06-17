import { FolderOpenOutlined } from '@ant-design/icons'
import { Button, Layout, Modal } from 'antd'
import { useState } from 'react'

function SandboxApp() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <Layout className="app-shell">
      <Layout.Content className="app-content">
        <Button
          type="primary"
          icon={<FolderOpenOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Open modal
        </Button>
        <Modal
          title="Sandbox modal"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          onOk={() => setIsModalOpen(false)}
        />
      </Layout.Content>
    </Layout>
  )
}

export default SandboxApp
