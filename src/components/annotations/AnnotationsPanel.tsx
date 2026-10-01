import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Popconfirm, Space, Tabs } from 'antd'
import { useState } from 'react'

import ToggleButton from '@/components/common/ToggleButton'
import SelectedLinksPanel from '@/components/selected-links/SelectedLinksPanel'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  removeAnnotation, selectAnnotation, selectAnnotations, selectCurrentAnnotation, toggleActiveAnnotation,
} from '@/store/slices/visualizationUi'

import AnnotationModal from './AnnotationModal'

export default function AnnotationsPanel() {
  const dispatch = useAppDispatch()
  const annotations = useAppSelector(selectAnnotations)
  const current = useAppSelector(selectCurrentAnnotation)
  const activeId = useAppSelector(state => state.visualizationUi.activeAnnotationId)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)

  return (
    <Card title="Annotations" className="annotations-panel">
      <div className="annotations-panel__header">
        <Tabs className="annotations-panel__tabs" activeKey={current.id} onChange={(id) => dispatch(selectAnnotation(id))}
          items={annotations.map((item) => ({ key: item.id, label: item.name }))} />
        <Button icon={<PlusOutlined />} onClick={() => setModal('create')}>Add Annotation</Button>
      </div>
      <p className="annotations-description">{current.description || 'No description'}</p>
      <Space wrap className="annotations-editor">
        <Button onClick={() => setModal('edit')}>Edit annotation</Button>
        <Popconfirm title="Delete this annotation and its links and nodes?"
          onConfirm={() => dispatch(removeAnnotation(current.id))}>
          <Button danger disabled={annotations.length === 1}>Delete annotation</Button>
        </Popconfirm>
        <ToggleButton active={activeId === current.id} onClick={() => dispatch(toggleActiveAnnotation(current.id))}>
          {activeId === current.id ? 'Active' : 'Inactive'}
        </ToggleButton>
      </Space>
      <SelectedLinksPanel key={current.id} />
      {modal && <AnnotationModal key={`${modal}-${current.id}`} annotation={modal === 'edit' ? current : undefined} onClose={() => setModal(null)} />}
    </Card>
  )
}
