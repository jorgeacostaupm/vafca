import {
  BarChartOutlined,
  CalculatorOutlined,
  DeploymentUnitOutlined,
  LinkOutlined,
  ReadOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Layout, Tooltip } from 'antd'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

import AnnotationsPanel from '@/components/annotations/AnnotationsPanel'
import AtlasPanel from '@/components/atlas'
import GroupingLegend from '@/components/atlas/GroupingLegend'
import DerivedNetworksPanel from '@/components/calculations/DerivedNetworksPanel'
import CatalogPanel from '@/components/management/CatalogPanel'
import NetworkVisualizationTab from '@/components/network/NetworkVisualizationTab'
import NetworkVisualizationSettingsPanel from '@/components/network/settings/NetworkVisualizationSettingsPanel'
import UserNotificationHost from '@/components/notifications/UserNotificationHost'
import { initialDataConfig } from '@/config/initialData'
import { APP_NAV_RAIL_WIDTH } from '@/config/ui'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { initializeDatasetAndDerivedState } from '@/store/slices/dataset'
import { patchWorkspaceUi } from '@/workspace/workspaceUiSlice'

type AppSectionKey = 'vis' | 'derive' | 'atlas' | 'links' | 'catalogs' | 'settings' | 'settings'

const appSections = [
  {
    key: 'vis',
    label: 'Networks',
    title: 'Rankings & Networks',
    icon: <BarChartOutlined />,
    children: <NetworkVisualizationTab />,
  },
  {
    key: 'derive',
    label: 'Derive networks',
    title: 'Derive networks',
    icon: <CalculatorOutlined />,
    children: <DerivedNetworksPanel />,
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
    label: 'Annotations',
    title: 'Annotations',
    icon: <LinkOutlined />,
    children: <AnnotationsPanel />,
  },
  {
    key: 'catalogs',
    label: 'Catalogs',
    title: 'Catalogs',
    icon: <ReadOutlined />,
    children: <CatalogPanel />,
  },
  {
    key: 'settings',
    label: 'Settings',
    title: 'Settings',
    icon: <SettingOutlined />,
    children: <NetworkVisualizationSettingsPanel />,
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
  const activeSection = useAppSelector(state => state.workspaceUi.activeSection)
  const setActiveSection = (activeSection: AppSectionKey) => dispatch(patchWorkspaceUi({ activeSection }))

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
            <Tooltip key={section.key} title={section.title} placement="right">
              <button
                type="button"
                className={`app-nav-rail__button ${
                  section.key === activeSection ? 'app-nav-rail__button--active' : ''
                }`}
                aria-label={section.title}
                aria-current={section.key === activeSection ? 'page' : undefined}
                onClick={() => setActiveSection(section.key)}
              >
                {section.icon}
              </button>
            </Tooltip>
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
        <GroupingLegend />
      </Layout.Content>
    </Layout>
  )
}

export default App
