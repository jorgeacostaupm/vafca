import { ApartmentOutlined, ProfileOutlined } from '@ant-design/icons'
import { Form, Segmented } from 'antd'

import { createNetworkSegmentedOption } from '@/components/network/segmentedOption'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { patchNetworkControls, selectNetworkControls } from '@/store/slices/networkVisualization'
import type { NetworkMatrixSelectorMode } from '@/types/networkVisualization'

const selectorModeOptions = [
  createNetworkSegmentedOption<NetworkMatrixSelectorMode>(
    'combined',
    <ProfileOutlined />,
    'Single',
  ),
  createNetworkSegmentedOption<NetworkMatrixSelectorMode>(
    'fields',
    <ApartmentOutlined />,
    'Fields',
  ),
]

export default function NetworkSelectorModeSetting() {
  const dispatch = useAppDispatch()
  const networkControls = useAppSelector(selectNetworkControls)

  return (
    <Form layout="vertical" style={{ marginBottom: 0 }}>
      <Form.Item
        label="Network selector"
        className="network-segmented-setting network-selector-mode-setting"
        style={{ marginBottom: 0 }}
      >
        <Segmented
          value={networkControls.matrixSelectorMode}
          onChange={(value) =>
            dispatch(
              patchNetworkControls({
                matrixSelectorMode: value as NetworkMatrixSelectorMode,
              }),
            )
          }
          options={selectorModeOptions}
        />
      </Form.Item>
    </Form>
  )
}
