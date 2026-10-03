import { ColorPicker, Form } from 'antd'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setAnnotationOverlapColor } from '@/store/slices/visualizationUi'

export default function AnnotationSettings() {
  const dispatch = useAppDispatch()
  const color = useAppSelector((state) => state.visualizationUi.annotationOverlapColor)
  return (
    <Form layout="vertical">
      <Form.Item label="Color for shared annotations">
        <ColorPicker
          aria-label="Annotation overlap color"
          value={color}
          disabledAlpha
          showText
          onChangeComplete={(value) => dispatch(setAnnotationOverlapColor(value.toHexString()))}
        />
      </Form.Item>
    </Form>
  )
}
