import { Form, Space, Switch } from 'antd'

import NetworkRangeControls from '@/components/network/NetworkRangeControls'
import NetworkSelectorModeSetting from '@/components/network/settings/NetworkSelectorModeSetting'
import NetworkViewTypeSetting from '@/components/network/settings/NetworkViewTypeSetting'
import SettingsSection from '@/components/network/settings/SettingsSection'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  patchNetworkControls,
  selectNetworkControls,
  setNetworkHideIsolatedNodes,
} from '@/store/slices/networkVisualization'

export default function NetworkViewsSettingsTab() {
  const dispatch = useAppDispatch()
  const networkControls = useAppSelector(selectNetworkControls)

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <SettingsSection
        description="Use this menu to configure how networks are displayed, filtered, and synchronized."
      >
        <NetworkViewTypeSetting />
        <NetworkSelectorModeSetting />
        <NetworkRangeControls />

        <Form layout="vertical" className="network-settings-views__switches">
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
          <Form.Item label="Self-links in % zooms" style={{ marginBottom: 0 }}>
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
