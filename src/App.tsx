import { useEffect } from "react";
import { Layout, Tabs } from "antd";
import NetworkVisualizationTab from "@/components/network/NetworkVisualizationTab";
import SelectedLinksPanel from "@/components/selected-links/SelectedLinksPanel";
import AtlasPanel from "@/components/atlas";
import UserNotificationHost from "@/components/notifications/UserNotificationHost";
import { initialDataConfig } from "@/config/initialData";
import { useAppDispatch } from "@/store/hooks";
import { initializeDatasetAndDerivedState } from "@/store/slices/dataset";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(initializeDatasetAndDerivedState(initialDataConfig));
  }, [dispatch]);

  return (
    <Layout className="app-shell">
      <UserNotificationHost />
      <Layout.Content className="app-content">
        <Tabs
          className="app-tabs"
          destroyOnHidden={true}
          items={[
            {
              key: "vis",
              label: "Network Visualization",
              children: <NetworkVisualizationTab />,
            },
            {
              key: "atlas",
              label: "Atlas",
              children: <AtlasPanel />,
            },
            {
              key: "links",
              label: "Selected Links",
              children: <SelectedLinksPanel />,
            },
          ]}
        />
      </Layout.Content>
    </Layout>
  );
}

export default App;
