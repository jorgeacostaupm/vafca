import "@/App.css";
import { useEffect } from "react";
import { Card, Layout, Space, Tabs, Typography } from "antd";
import DatasetManagement from "@/components/management";
import NetworkVisualizationTab from "@/components/network/NetworkVisualizationTab";
import SelectedLinksPanel from "@/components/selected-links/SelectedLinksPanel";
import AtlasPanel from "@/components/atlas";
import { useAppDispatch } from "@/store/hooks";
import { initializeDatasetAndDerivedState } from "@/store/slices/dataset";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(initializeDatasetAndDerivedState());
  }, [dispatch]);

  return (
    <Layout className="app-shell">
      <Layout.Content className="app-content">
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          <Card variant="outlined">
            <Tabs
              destroyOnHidden={true}
              items={[
                {
                  key: "dataset",
                  label: "Management",
                  children: <DatasetManagement />,
                },
                {
                  key: "network",
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
          </Card>
        </Space>
      </Layout.Content>
    </Layout>
  );
}

export default App;
