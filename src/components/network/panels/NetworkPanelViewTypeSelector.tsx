import { Select } from 'antd'
import { networkPanelViewTypeOptions } from '@/components/network/networkViewTypeOptions'
import { useAppDispatch } from '@/store/hooks'
import { mutateNetworkViewType } from '@/store/slices/networkVisualization'
import type { NetworkViewDescriptor, NetworkViewType } from '@/types/networkVisualization'

type NetworkPanelViewTypeSelectorProps = {
  view: NetworkViewDescriptor
}

export default function NetworkPanelViewTypeSelector({ view }: NetworkPanelViewTypeSelectorProps) {
  const dispatch = useAppDispatch()

  return (
    <Select<NetworkViewType>
      aria-label="View type"
      size="small"
      value={view.type}
      options={networkPanelViewTypeOptions}
      popupMatchSelectWidth={false}
      onChange={(nextType) =>
        dispatch(
          mutateNetworkViewType({
            viewId: view.id,
            nextType,
          }),
        )
      }
    />
  )
}
