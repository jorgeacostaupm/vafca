import ToggleButton from '@/components/common/ToggleButton'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectAnnotations,updateAnnotation } from '@/store/slices/visualizationUi'

export default function AnnotationSelector() {
  const dispatch = useAppDispatch()
  const annotations = useAppSelector(selectAnnotations)
  return <div className="annotations-selector" role="group" aria-label="Visible annotations">
    {annotations.map(item => <ToggleButton key={item.id} active={item.active}
      onClick={() => dispatch(updateAnnotation({ id: item.id, active: !item.active }))}>
      <span className="annotations-swatch" style={{ backgroundColor: item.color }} />{item.name}
    </ToggleButton>)}
  </div>
}
