import { DownOutlined } from '@ant-design/icons'
import { Button, Dropdown } from 'antd'

import { networkViewTypeIconOptions } from '@/components/network/networkViewTypeOptions'
import { useAppDispatch } from '@/store/hooks'
import { mutateNetworkViewType } from '@/store/slices/networkVisualization'
import type { NetworkViewDescriptor } from '@/types/networkVisualization'

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
  const selectedType = spatialVisible ? '3d' : view.type
  const options = [
    ...networkViewTypeIconOptions,
    {
      value: '3d' as const,
      label: <span title={spatialDisabledReason ?? '3D'}>3D</span>,
      disabled: spatialDisabledReason !== null,
    },
  ]

  return (
    <Dropdown
      placement="bottomLeft"
      trigger={['click']}
      menu={{
        selectable: true,
        selectedKeys: [selectedType],
        items: options.map(({ value: nextType, ...option }) => ({
          ...option,
          key: nextType,
          onClick: () => {
            onSpatialVisibleChange(nextType === '3d')
            if (nextType === '3d') return
            dispatch(mutateNetworkViewType({ viewId: view.id, nextType }))
          },
        })),
      }}
    >
      <Button
        size="small"
        type="text"
        aria-label="View type"
        title="View type"
        icon={options.find(({ value }) => value === selectedType)?.label}
      >
        <DownOutlined />
      </Button>
    </Dropdown>
  )
}
