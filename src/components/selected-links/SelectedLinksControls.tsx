import { DeleteOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Button, Dropdown, Space, Switch, Tabs, Tooltip, Typography } from 'antd'
import { useMemo } from 'react'

import type { DownloadMode } from '@/components/selected-links/selectedLinksPanel.types'
import { useAppSelector } from '@/store/hooks'
import { selectCurrentAnnotation } from '@/store/slices/visualizationUi'

type SelectedLinksControlsProps = {
  listType: 'links' | 'nodes'
  onListTypeChange: (type: 'links' | 'nodes') => void
  linksCount: number
  downloading: boolean
  onDownload: (mode: DownloadMode) => void
  onClear: () => void
  viewEnabled: boolean
  onViewEnabledChange: (enabled: boolean) => void
  onOpenColumns: () => void
}

export default function SelectedLinksControls({
  listType,
  onListTypeChange,
  linksCount,
  downloading,
  onDownload,
  onClear,
  viewEnabled,
  onViewEnabledChange,
  onOpenColumns,
}: SelectedLinksControlsProps) {
  const annotation = useAppSelector(selectCurrentAnnotation)
  const downloadMenu = useMemo<MenuProps>(
    () => ({
      items: [
        {
          key: 'all',
          label: 'Download all available networks',
        },
        {
          key: 'viewer',
          label: 'Download selected networks',
        },
      ],
      onClick: ({ key }) => {
        if (key !== 'all' && key !== 'viewer') return
        onDownload(key)
      },
    }),
    [onDownload],
  )

  const actions = (
    <div className="network-action-toolbar" aria-label="Selected links tools">
      <Space wrap>
        <Space>
          <Typography.Text type="secondary">Network view</Typography.Text>
          <Switch
            aria-label="Network view"
            size="small"
            checked={viewEnabled}
            onChange={onViewEnabledChange}
          />
        </Space>
        <Tooltip title="Add column">
          <Button aria-label="Add column" icon={<PlusOutlined />} onClick={onOpenColumns}>
            Add column
          </Button>
        </Tooltip>
        <Tooltip title="Download selected links">
          <Dropdown menu={downloadMenu} trigger={['click']}>
            <Button
              aria-label="Download selected links"
              disabled={linksCount === 0}
              icon={<DownloadOutlined />}
              loading={downloading}
            >
              Download
            </Button>
          </Dropdown>
        </Tooltip>
        <Tooltip title="Clear selected links">
          <Button
            aria-label="Clear selected links"
            disabled={linksCount === 0}
            icon={<DeleteOutlined />}
            onClick={onClear}
          >
            Clear
          </Button>
        </Tooltip>
      </Space>
    </div>
  )

  return (
    <div className="annotations-list-controls">
      <div className="annotations-list-controls__header">
        <Tabs
          className="annotations-list-controls__tabs"
          activeKey={listType}
          onChange={(key) => onListTypeChange(key === 'nodes' ? 'nodes' : 'links')}
          items={[
            { key: 'links', label: `Links (${linksCount})` },
            { key: 'nodes', label: `Nodes (${annotation.nodes.length})` },
          ]}
        />
        {actions}
      </div>
    </div>
  )
}
