import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import { useState } from 'react'

import DataSummarySection from '@/components/management/components/DataSummarySection'
import NetworkUploader from '@/components/management/components/NetworkUploader'
import WorkspaceControls from '@/components/management/WorkspaceControls'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  downloadCurrentDataset,
  selectDatasetData,
  selectDatasetDownloadStatus,
  selectDatasetStatus,
} from '@/store/slices/dataset'

export default function DataManagementPanel() {
  const dispatch = useAppDispatch()
  const [importOpen, setImportOpen] = useState(false)
  const data = useAppSelector(selectDatasetData)
  const status = useAppSelector(selectDatasetStatus)
  const downloadStatus = useAppSelector(selectDatasetDownloadStatus)

  return (
    <div className="data-management-panel">
      <div className="data-management-actions">
        <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
          Import data
        </Button>
        <WorkspaceControls />
        <Button
          icon={<DownloadOutlined />}
          onClick={() => void dispatch(downloadCurrentDataset())}
          loading={downloadStatus === 'loading'}
          disabled={!data || status === 'loading'}
        >
          Export data
        </Button>
      </div>
      <DataSummarySection />
      <Modal title="Import data" open={importOpen} footer={null} onCancel={() => setImportOpen(false)}>
        <NetworkUploader />
      </Modal>
    </div>
  )
}
