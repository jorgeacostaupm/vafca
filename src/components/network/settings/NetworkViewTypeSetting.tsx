import { Form, Segmented } from 'antd'

import { networkViewTypeOptions } from '@/components/network/networkViewTypeOptions'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { patchNetworkControls, selectNetworkControls } from '@/store/slices/networkVisualization'
import type { NetworkViewType } from '@/types/networkVisualization'

export default function NetworkViewTypeSetting() {
  const dispatch = useAppDispatch()
  const networkControls = useAppSelector(selectNetworkControls)

  return (
    <Form layout="vertical" style={{ marginBottom: 0 }}>
      <Form.Item
        label="Default view"
        className="network-segmented-setting network-view-type-setting"
        style={{ marginBottom: 0 }}
      >
        <Segmented
          value={networkControls.viewType}
          onChange={(value) =>
            dispatch(
              patchNetworkControls({
                viewType: value as NetworkViewType,
              }),
            )
          }
          options={networkViewTypeOptions}
        />
      </Form.Item>
    </Form>
  )
}
