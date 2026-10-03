import { Form, Space, Switch } from 'antd'

import SettingsSection from '@/components/common/SettingsSection'
import NetworkSelectorModeSetting from '@/components/network/settings/NetworkSelectorModeSetting'
import NetworkViewTypeSetting from '@/components/network/settings/NetworkViewTypeSetting'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  patchNetworkControls,
  selectNetworkControls,
  setNetworkHideIsolatedNodes,
} from '@/store/slices/networkVisualization'
import { setShowGroupingLegend } from '@/store/slices/visualizationUi'

export default function NetworkViewsSettingsTab() {
  const dispatch = useAppDispatch()
  const networkControls = useAppSelector(selectNetworkControls)
  const showGroupingLegend = useAppSelector((state) => state.visualizationUi.showGroupingLegend)

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <SettingsSection>
        <NetworkViewTypeSetting />
        <NetworkSelectorModeSetting />

        <Form layout="vertical" className="network-settings-views__switches">
          <Form.Item label="Floating node color legend">
            <Switch
              aria-label="Floating node color legend"
              checked={showGroupingLegend}
              onChange={(value) => dispatch(setShowGroupingLegend(value))}
            />
          </Form.Item>
          <Form.Item label="Coordinated zoom">
            <Switch
              checked={networkControls.syncZoom}
              onChange={(value) =>
                dispatch(
                  patchNetworkControls({
                    syncZoom: value,
                  }),
                )
              }
            />
          </Form.Item>
          <Form.Item label="Hide isolated nodes">
            <Switch
              checked={networkControls.hideIsolatedNodes}
              onChange={(value) =>
                dispatch(
                  setNetworkHideIsolatedNodes({
                    value,
                  }),
                )
              }
            />
          </Form.Item>
          <Form.Item label="Self-links in % filters" style={{ marginBottom: 0 }}>
            <Switch
              checked={networkControls.percentZoomIncludeAutoconnections}
              onChange={(value) =>
                dispatch(
                  patchNetworkControls({
                    percentZoomIncludeAutoconnections: value,
                  }),
                )
              }
            />
          </Form.Item>
        </Form>
      </SettingsSection>
    </Space>
  )
}
