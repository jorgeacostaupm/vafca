import { ColorPicker, Form, Input, Modal } from 'antd'

import { useAppDispatch } from '@/store/hooks'
import { createNewAnnotation, updateAnnotation } from '@/store/slices/visualizationUi'
import { createAnnotation } from '@/store/slices/visualizationUi/annotationDefaults'
import type { Annotation } from '@/types/visualizationUi'

type AnnotationDetails = Pick<Annotation, 'name' | 'description' | 'color'>

export default function AnnotationModal({ annotation, onClose }: {
  annotation?: Annotation
  onClose: () => void
}) {
  const dispatch = useAppDispatch()
  const [form] = Form.useForm<AnnotationDetails>()
  return (
    <Modal open title={annotation ? 'Edit annotation' : 'Add annotation'}
      okText={annotation ? 'Save' : 'Create'} onCancel={onClose} onOk={() => form.submit()}>
      <Form form={form} layout="vertical"
        initialValues={annotation ?? createAnnotation('', '')}
        onFinish={(values) => {
          const details = { ...values, name: values.name.trim() }
          dispatch(annotation ? updateAnnotation({ id: annotation.id, ...details }) : createNewAnnotation(details))
          onClose()
        }}>
        <Form.Item name="name" label="Name" rules={[{ required: true, whitespace: true, message: 'Enter a name' }]}>
          <Input aria-label="Annotation name" autoFocus />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea aria-label="Annotation description" />
        </Form.Item>
        <Form.Item name="color" label="Color" getValueFromEvent={(color) => color.toHexString()}>
          <ColorPicker aria-label="Annotation color" disabledAlpha showText />
        </Form.Item>
      </Form>
    </Modal>
  )
}
