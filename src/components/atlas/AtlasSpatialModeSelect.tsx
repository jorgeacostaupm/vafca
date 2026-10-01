import { UpOutlined } from '@ant-design/icons'
import { Select } from 'antd'

import { ATLAS_SPATIAL_MODE_OPTIONS } from '@/config/ui'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setAtlasPanelState } from '@/store/slices/visualizationUi'

export default function AtlasSpatialModeSelect({ allowNoSpatialData = true }: { allowNoSpatialData?: boolean }) {
  const dispatch = useAppDispatch()
  const mode = useAppSelector(state => state.visualizationUi.atlasPanel.spatialMode)
  return <Select<'geometry' | 'none'>
    aria-label="Spatial representation"
    size="small"
    placement="topLeft"
    suffixIcon={<UpOutlined />}
    value={allowNoSpatialData && mode === 'none' ? 'none' : 'geometry'}
    options={allowNoSpatialData ? ATLAS_SPATIAL_MODE_OPTIONS : ATLAS_SPATIAL_MODE_OPTIONS.filter(option => option.value !== 'none')}
    popupMatchSelectWidth={false}
    onChange={spatialMode => dispatch(setAtlasPanelState({ spatialMode, is3dAvailable: spatialMode !== 'none' }))}
  />
}
