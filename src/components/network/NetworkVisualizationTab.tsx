import { Alert, Card, Tabs } from 'antd'

import NetworkVisualizationWorkspace from '@/components/network/NetworkVisualizationWorkspace'
import RankingQueryControls from '@/components/rankings/RankingQueryControls'
import NetworkFilterStatus from '@/components/selectors/NetworkFilterStatus'
import NetworkSelectorActions from '@/components/selectors/NetworkSelectorActions'
import NetworkSelectorControls from '@/components/selectors/NetworkSelectorControls'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setRankingActiveTab } from '@/store/slices/rankings'

function ViewsControls() {
  return (
    <>
      <div>
        <NetworkSelectorControls />
      </div>
      <NetworkFilterStatus />
    </>
  )
}

function RankingsControls() {
  const rankingError = useAppSelector((state) => state.rankings.error)

  return (
    <div>
      <RankingQueryControls />
      {rankingError ? <Alert type="error" showIcon message={rankingError} /> : null}
    </div>
  )
}

export default function NetworkVisualizationTab() {
  const dispatch = useAppDispatch()
  const activeTab = useAppSelector((state) => state.rankings.activeTab)

  return (
    <>
      <Card variant="outlined" className="network-control-card">
        <Tabs
          size="small"
          activeKey={activeTab}
          renderTabBar={(props, DefaultTabBar) => (
            <div className="network-control-card__header">
              <DefaultTabBar {...props} />
              <NetworkSelectorActions />
            </div>
          )}
          destroyOnHidden
          onChange={(key) => dispatch(setRankingActiveTab(key as 'views' | 'rankings'))}
          items={[
            { key: 'views', label: 'Networks', children: <ViewsControls /> },
            {
              key: 'rankings',
              label: 'Rankings',
              children: <RankingsControls />,
            },
          ]}
        />
      </Card>
      <NetworkVisualizationWorkspace />
    </>
  )
}
