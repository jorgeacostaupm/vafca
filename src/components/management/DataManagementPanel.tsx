import { DownloadOutlined } from '@ant-design/icons'
import { Button, Tabs, Typography } from 'antd'
import type { ReactNode } from 'react'

import MatrixSummarySection from '@/components/management/components/MatrixSummarySection'
import NetworkUploader from '@/components/management/components/NetworkUploader'
import WorkspaceControls from '@/components/management/WorkspaceControls'
import { DEFAULT_DATA_MANAGEMENT_TAB } from '@/config/ui'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  downloadCurrentDataset,
  selectDatasetData,
  selectDatasetDownloadStatus,
  selectDatasetError,
  selectDatasetStatus,
} from '@/store/slices/dataset'
import { getDatasetCatalogs, getDatasetNetworkStats } from '@/utils/datasetAccessors'

type DataManagementSectionProps = {
  description: string
  actions?: ReactNode
  children: ReactNode
}

function DataManagementSection({ description, actions, children }: DataManagementSectionProps) {
  return (
    <section className="data-management-section">
      <div className="data-management-section__header data-management-section__header--split">
        <Typography.Text type="secondary">{description}</Typography.Text>
        {actions}
      </div>
      {children}
    </section>
  )
}

function CurrentDatasetTab() {
  const dispatch = useAppDispatch()
  const data = useAppSelector(selectDatasetData)
  const downloadStatus = useAppSelector(selectDatasetDownloadStatus)
  const catalogs = getDatasetCatalogs(data)
  const networkStats = getDatasetNetworkStats(data)
  const metadata =
    data && catalogs
      ? [
          { label: 'Networks', value: networkStats.total },
          { label: catalogs.core.source.label, value: Object.keys(catalogs.sources).length },
          { label: 'Measures', value: Object.keys(catalogs.measures).length },
          { label: 'Statistics', value: Object.keys(catalogs.statistics).length },
          { label: 'Aspects', value: catalogs.aspects.length },
        ]
      : []

  const handleDownload = () => {
    void dispatch(downloadCurrentDataset())
  }

  return (
    <div className="data-management-load">
      {data ? (
        <DataManagementSection
          description="Overview of the loaded network package."
          actions={
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              loading={downloadStatus === 'loading'}
            >
              Download JSON
            </Button>
          }
        >
          <div className="data-management-metrics">
            {metadata.map((item) => (
              <div key={item.label} className="data-management-metric">
                <span className="data-management-metric__value">{item.value}</span>
                <span className="data-management-metric__label">{item.label}</span>
              </div>
            ))}
          </div>

          <MatrixSummarySection />
        </DataManagementSection>
      ) : (
        <div className="data-management-empty">
          <Typography.Text type="secondary">No dataset loaded yet.</Typography.Text>
        </div>
      )}
    </div>
  )
}

function ImportDatasetTab() {
  return (
    <div className="data-management-load">
      <DataManagementSection description="Load one VAFCA ZIP dataset. Recoverable issues are reported after import.">
        <NetworkUploader />
      </DataManagementSection>
    </div>
  )
}

function DataManagementPanel() {
  const status = useAppSelector(selectDatasetStatus)
  const error = useAppSelector(selectDatasetError)

  const items = [
    { key: 'workspace', label: 'Workspace', children: <WorkspaceControls /> },
    {
      key: 'current',
      label: 'Current',
      children:
        status === 'loading' ? (
          <Typography.Text>Loading dataset...</Typography.Text>
        ) : status === 'error' ? (
          <Typography.Text type="danger">Error: {error}</Typography.Text>
        ) : (
          <CurrentDatasetTab />
        ),
    },
    {
      key: 'import',
      label: 'Import',
      children: <ImportDatasetTab />,
    },
  ]

  return <Tabs defaultActiveKey={DEFAULT_DATA_MANAGEMENT_TAB} destroyOnHidden items={items} />
}

export default DataManagementPanel
