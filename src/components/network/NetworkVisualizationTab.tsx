import { Alert, Card, Space, Tabs } from "antd";

import NetworkVisualizationWorkspace from "@/components/network/NetworkVisualizationWorkspace";
import RankingQueryControls from "@/components/rankings/RankingQueryControls";
import NetworkFilterStatus from "@/components/selectors/NetworkFilterStatus";
import NetworkSelectorActions from "@/components/selectors/NetworkSelectorActions";
import SelectorControls from "@/components/selectors/SelectorControls";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setRankingActiveTab } from "@/store/slices/rankings";

function ViewsControls() {
  return (
    <>
      <div className="network-control-card__selectors">
        <SelectorControls />
      </div>
      <NetworkFilterStatus />
    </>
  );
}

export default function NetworkVisualizationTab() {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.rankings.activeTab);
  const rankingError = useAppSelector((state) => state.rankings.error);

  return (
    <div className="network-visualization-tab">
      <Card className="network-control-card" variant="outlined">
        <Tabs
          activeKey={activeTab}
          onChange={(key) =>
            dispatch(setRankingActiveTab(key as "views" | "rankings"))
          }
          tabBarExtraContent={<NetworkSelectorActions />}
          items={[
            { key: "views", label: "Views", children: <ViewsControls /> },
            {
              key: "rankings",
              label: "Rankings",
              children: (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <RankingQueryControls />
                  {rankingError ? (
                    <Alert type="error" showIcon message={rankingError} />
                  ) : null}
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <NetworkVisualizationWorkspace />
    </div>
  );
}
