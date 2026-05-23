import { BarChartOutlined, DatabaseOutlined } from '@ant-design/icons'
import { Form, Segmented } from 'antd'
import { createNetworkSegmentedOption } from '@/components/network/segmentedOption'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectUiRangeMode, setUiRangeMode } from '@/store/slices/visualizationUi'
import type { UiRangeMode } from '@/types/connectivityBundle'

const rangeModeOptions = [
  createNetworkSegmentedOption<UiRangeMode>(
    'logical_default',
    <DatabaseOutlined />,
    'Catalog',
  ),
  createNetworkSegmentedOption<UiRangeMode>(
    'observed',
    <BarChartOutlined />,
    'Observed',
  ),
]

export default function NetworkRangeControls() {
  const dispatch = useAppDispatch()
  const uiRangeMode = useAppSelector(selectUiRangeMode)

  return (
    <Form layout="vertical" style={{ marginBottom: 0 }}>
      <Form.Item
        label="Range"
        className="network-segmented-setting network-range-mode-setting"
        style={{ marginBottom: 0 }}
      >
        <Segmented
          value={uiRangeMode}
          onChange={(value) => dispatch(setUiRangeMode(value as UiRangeMode))}
          options={rangeModeOptions}
        />
      </Form.Item>
    </Form>
  )
}
