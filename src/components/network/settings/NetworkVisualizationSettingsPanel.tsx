import { Card, Tabs } from 'antd'

import AnnotationSettings from '@/components/annotations/AnnotationSettings'
import SettingsSection from '@/components/common/SettingsSection'
import { DEFAULT_NETWORK_SETTINGS_TAB } from '@/config/ui'

import CircularSettingsTab from './CircularSettingsTab'
import MatrixSettingsTab from './MatrixSettingsTab'
import NetworkRankingsSettingsTab from './NetworkRankingsSettingsTab'
import NetworkViewsSettingsTab from './NetworkViewsSettingsTab'
import NodeLinkSettingsTab from './NodeLinkSettingsTab'
import SpatialSettingsTab from './SpatialSettingsTab'

export default function NetworkVisualizationSettingsPanel() {
  return (
    <Card title="Settings" className="network-settings-page">
      <Tabs
        defaultActiveKey={DEFAULT_NETWORK_SETTINGS_TAB}
        destroyOnHidden
        items={[
          {
            key: 'general',
            label: 'General',
            children: (
              <>
                <NetworkViewsSettingsTab />
                <SettingsSection>
                  <AnnotationSettings />
                </SettingsSection>
              </>
            ),
          },
          { key: 'spatial', label: '3D Brain', children: <SpatialSettingsTab /> },
          {
            key: 'matrices',
            label: 'Matrices',
            children: <MatrixSettingsTab />,
          },
          {
            key: 'circular',
            label: 'Connectogram',
            children: <CircularSettingsTab />,
          },
          {
            key: 'node-link',
            label: 'Node-Link',
            children: <NodeLinkSettingsTab />,
          },
          {
            key: 'rankings',
            label: 'Rankings',
            children: <NetworkRankingsSettingsTab />,
          },
        ]}
      />
    </Card>
  )
}
