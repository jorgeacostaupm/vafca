import { EditOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Button, Empty, Popover, Tooltip } from 'antd'
import { useState } from 'react'

import { useAppSelector } from '@/store/hooks'

import RoiMetadataEditor from './RoiMetadataEditor'

export default function RoiMetadataActions({ id }: { id: string }) {
  const metadata = useAppSelector((state) => state.atlasUi.labelsById[id]?.metadata)
  const [editing, setEditing] = useState(false)
  const entries = Object.entries(metadata ?? {})
  const content = (
    <div className="atlas-panel__metadata">
      {entries.length === 0 ? <Empty description="No metadata available" /> : (
        <dl>
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value !== null && typeof value === 'object' ? (
                <details><summary>View value</summary><pre>{JSON.stringify(value, null, 2)}</pre></details>
              ) : String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
  return (
    <div className="atlas-panel__metadata-actions">
      <Popover content={content} trigger="click">
        <Button type="text" icon={<InfoCircleOutlined />} aria-label={`View metadata for ${id}`} title="View ROI metadata" />
      </Popover>
      <Tooltip title="Edit ROI metadata">
        <Button type="text" icon={<EditOutlined />} aria-label={`Edit metadata for ${id}`}
          disabled={entries.length === 0} onClick={() => setEditing(true)} />
      </Tooltip>
      {editing && <RoiMetadataEditor id={id} onClose={() => setEditing(false)} />}
    </div>
  )
}
