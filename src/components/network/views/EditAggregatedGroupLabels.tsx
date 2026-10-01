import { EditOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import { useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { renameAggregatedGroups } from '@/store/slices/networkVisualization'

import AggregateGroupLabelsEditor from './AggregateGroupLabelsEditor'

export default function EditAggregatedGroupLabels({ viewId }: { viewId: string }) {
  const dispatch = useAppDispatch()
  const network = useAppSelector(state => {
    const id = state.networkVisualization.viewsById[viewId]?.temporaryNetworkId
    return id ? state.networkVisualization.temporaryNetworksById[id] : undefined
  })
  const [labels, setLabels] = useState<Record<string, string> | null>(null)
  if (!network) return null

  return <>
    <Button size="small" type="text" icon={<EditOutlined />}
      aria-label="Edit group labels" title="Edit group labels"
      onClick={() => setLabels({ ...network.labelNames })} />
    {labels !== null && (
      <Modal open title="Edit group labels" okText="Save labels"
        onCancel={() => setLabels(null)} onOk={() => {
          dispatch(renameAggregatedGroups({ viewId, labels }))
          setLabels(null)
        }}>
        <AggregateGroupLabelsEditor groups={network.groups} labels={labels}
          onChange={(id, label) => setLabels(previous => ({ ...previous, [id]: label }))} />
      </Modal>
    )}
  </>
}
