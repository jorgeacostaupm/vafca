import { DownOutlined } from '@ant-design/icons'
import { Select } from 'antd'

import { networkViewTypeIconOptions } from '@/components/network/networkViewTypeOptions'
import { useAppDispatch } from '@/store/hooks'
import { mutateNetworkViewType } from '@/store/slices/networkVisualization'
import type { NetworkViewDescriptor, NetworkViewType } from '@/types/networkVisualization'

type NetworkViewTypeSelectorProps = {
  view: NetworkViewDescriptor
  spatialVisible: boolean
  spatialDisabledReason: string | null
  onSpatialVisibleChange: (visible: boolean) => void
}

export default function NetworkViewTypeSelector({
  view,
  spatialVisible,
  spatialDisabledReason,
  onSpatialVisibleChange,
}: NetworkViewTypeSelectorProps) {
  const dispatch = useAppDispatch()

  return (
    <Select<NetworkViewType | '3d'>
      aria-label="View type"
      prefix={<DownOutlined />}
      suffixIcon={null}
      size="small"
      value={spatialVisible ? '3d' : view.type}
      options={[
        ...networkViewTypeIconOptions,
        {
          value: '3d',
          label: <span title={spatialDisabledReason ?? '3D'}>3D</span>,
          disabled: spatialDisabledReason !== null,
        },
      ]}
      popupMatchSelectWidth={false}
      onChange={(nextType) => {
        onSpatialVisibleChange(nextType === '3d')
        if (nextType === '3d') return
        dispatch(
          mutateNetworkViewType({
            viewId: view.id,
            nextType,
          }),
        )
      }}
    />
  )
}
