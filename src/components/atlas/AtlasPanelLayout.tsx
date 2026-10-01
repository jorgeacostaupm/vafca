import { Card } from 'antd'
import type { CSSProperties, ReactNode } from 'react'

import SettingsSection from '@/components/network/settings/SettingsSection'
import { ATLAS_PANEL_LIST_WIDTH_PERCENT, DEFAULT_ATLAS_PANEL_VIEWER_HEIGHT } from '@/config/ui'

type AtlasPanelLayoutProps = {
  has3d: boolean
  toolbar: ReactNode
  filters: ReactNode
  list: ReactNode
  viewer: ReactNode
}

export function AtlasPanelLayout({
  has3d,
  toolbar,
  filters,
  list,
  viewer,
}: AtlasPanelLayoutProps) {
  const panelStyle = {
    '--atlas-panel-list-width': `${ATLAS_PANEL_LIST_WIDTH_PERCENT}fr`,
    '--atlas-panel-sidebar-width': `${100 - ATLAS_PANEL_LIST_WIDTH_PERCENT}fr`,
    '--atlas-panel-viewer-size': `${DEFAULT_ATLAS_PANEL_VIEWER_HEIGHT}px`,
  } as CSSProperties

  const controlCard = (
    <Card className="atlas-panel__control-card" title="Nodes Management" extra={toolbar}>
      <SettingsSection
        description="Search, filter, and choose which atlas nodes are active."
        padded={false}
      >
        {filters}
      </SettingsSection>
    </Card>
  )

  return (
    <div className="atlas-panel" style={panelStyle}>
      <div className="atlas-panel__sidebar">
        <div className="atlas-panel__control-region">{controlCard}</div>
        {has3d ? <div className="atlas-panel__viewer-region">{viewer}</div> : null}
      </div>
      <div className="atlas-panel__list-region">
        <div className="atlas-panel__list" tabIndex={0} role="region" aria-label="Atlas nodes">
          {list}
        </div>
      </div>
    </div>
  )
}
