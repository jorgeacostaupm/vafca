import {
  BarChartOutlined,
  DeploymentUnitOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { Layout } from 'antd'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import AtlasPanel from '@/components/atlas'
import NetworkVisualizationTab from '@/components/network/NetworkVisualizationTab'
import UserNotificationHost from '@/components/notifications/UserNotificationHost'
import SelectedLinksPanel from '@/components/selected-links/SelectedLinksPanel'
import { initialDataConfig } from '@/config/initialData'
import { APP_NAV_RAIL_WIDTH, DEFAULT_APP_SECTION } from '@/config/ui'
import { useAppDispatch } from '@/store/hooks'
import { initializeDatasetAndDerivedState } from '@/store/slices/dataset'

type AppSectionKey = 'vis' | 'atlas' | 'links'

const appSections = [
  {
    key: 'vis',
    label: 'Networks',
    title: 'Rankings & Networks',
    icon: <BarChartOutlined />,
    children: <NetworkVisualizationTab />,
  },
  {
    key: 'atlas',
    label: 'Atlas',
    title: 'Atlas',
    icon: <DeploymentUnitOutlined />,
    children: <AtlasPanel />,
  },
  {
    key: 'links',
    label: 'Links',
    title: 'Selected Links',
    icon: <LinkOutlined />,
    children: <SelectedLinksPanel />,
  },
] satisfies Array<{
  key: AppSectionKey
  label: string
  title: string
  icon: ReactNode
  children: ReactNode
}>

function App() {
  const dispatch = useAppDispatch()
  const [activeSection, setActiveSection] = useState<AppSectionKey>(
    DEFAULT_APP_SECTION,
  )

  useEffect(() => {
    void dispatch(initializeDatasetAndDerivedState(initialDataConfig))
  }, [dispatch])

  return (
    <Layout className="app-shell">
      <UserNotificationHost />
      <Layout.Sider
        className="app-nav-rail"
        collapsed
        collapsedWidth={APP_NAV_RAIL_WIDTH}
        trigger={null}
        width={APP_NAV_RAIL_WIDTH}
      >
        <div className="app-nav-rail__brand" aria-hidden="true">
          V
        </div>
        <nav className="app-nav-rail__nav" aria-label="Main sections">
          {appSections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`app-nav-rail__button ${
                section.key === activeSection ? 'app-nav-rail__button--active' : ''
              }`}
              aria-label={section.title}
              aria-current={section.key === activeSection ? 'page' : undefined}
              title={section.title}
              onClick={() => setActiveSection(section.key)}
            >
              {section.icon}
            </button>
          ))}
        </nav>
      </Layout.Sider>
      <Layout.Content className="app-content">
        {appSections.map((section) => (
          <section
            key={section.key}
            className="app-section"
            hidden={section.key !== activeSection}
          >
            {section.children}
          </section>
        ))}
      </Layout.Content>
    </Layout>
  )
}

export default App
