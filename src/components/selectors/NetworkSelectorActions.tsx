import { FilterOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { useState } from 'react'

import AnnotationSelector from '@/components/annotations/AnnotationSelector'
import ToggleButton from '@/components/common/ToggleButton'
import NetworkEdgeFilterModal from '@/components/network/edge-filter/NetworkEdgeFilterModal'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { patchNetworkControls, selectNetworkControls } from '@/store/slices/networkVisualization'
import { selectUiRangeMode, setUiRangeMode } from '@/store/slices/visualizationUi'

function FilterAction() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip title="Configure edge filters">
        <Button
          aria-label="Global filter"
          icon={<FilterOutlined />}
          onClick={() => setOpen(true)}
        >
          Global filter
        </Button>
      </Tooltip>
      <NetworkEdgeFilterModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default function NetworkSelectorActions() {
  const dispatch = useAppDispatch()
  const rangeMode = useAppSelector(selectUiRangeMode)
  const { syncZoom } = useAppSelector(selectNetworkControls)

  return (
    <div className="network-action-toolbar" aria-label="Network tools">
      <FilterAction />
      <Tooltip title="Share color scales between active matrices with the same connectivity measure and statistic">
        <ToggleButton
          className="network-global-scale"
          active={rangeMode === 'shared'}
          onClick={() => dispatch(setUiRangeMode(rangeMode === 'shared' ? 'view_observed' : 'shared'))}
        >
          Global scale
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Synchronize zoom between compatible views">
        <ToggleButton
          active={syncZoom}
          onClick={() => dispatch(patchNetworkControls({ syncZoom: !syncZoom }))}
        >
          Coordinated zoom
        </ToggleButton>
      </Tooltip>
      <AnnotationSelector />
    </div>
  )
}
