import { Layout, Tabs } from 'antd'
import { useEffect } from 'react'

import AtlasPanel from '@/components/atlas'
import NetworkVisualizationTab from '@/components/network/NetworkVisualizationTab'
import UserNotificationHost from '@/components/notifications/UserNotificationHost'
import SelectedLinksPanel from '@/components/selected-links/SelectedLinksPanel'
import { initialDataConfig } from '@/config/initialData'
import { useAppDispatch } from '@/store/hooks'
import { initializeDatasetAndDerivedState } from '@/store/slices/dataset'

function App() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    void dispatch(initializeDatasetAndDerivedState(initialDataConfig))
  }, [dispatch])

  return (
    <Layout className="app-shell">
      <UserNotificationHost />
      <Layout.Content className="app-content">
        <Tabs
          className="app-tabs"
          destroyOnHidden={false}
          items={[
            {
              key: 'vis',
              label: 'Rankings & Networks',
              children: <NetworkVisualizationTab />,
            },
            {
              key: 'atlas',
              label: 'Atlas',
              children: <AtlasPanel />,
            },
            {
              key: 'links',
              label: 'Selected Links',
              children: <SelectedLinksPanel />,
            },
          ]}
        />
      </Layout.Content>
    </Layout>
  )
}

export default App
