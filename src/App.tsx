import "@/App.css";
import { useEffect, useMemo } from "react";
import { Card, Layout, Space, Tabs, Typography } from "antd";
import DatasetManagement from "@/components/DatasetManagement";
import NetworkVisualizationTab from "@/components/network/NetworkVisualizationTab";
import SelectedLinksPanel from "@/components/matrix/SelectedLinksPanel";
import AtlasPanel from "@/components/AtlasPanel";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { buildAtlasState, setAtlasLabels } from "@/store/slices/atlasSlice";
import { loadTestDataset } from "@/store/slices/datasetSlice";
import { setMatrixShape } from "@/store/slices/visualizationUiSlice";
import { normalizeMatrixOrder } from "@/utils/matrixOrder";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";

function App() {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlas = useAppSelector((state) => state.atlas);
  const atlasDefinition = useAtlasDefinition(
    dataset?.metadata.atlasId ?? dataset?.metadata.atlas,
  );

  useEffect(() => {
    dispatch(loadTestDataset());
  }, [dispatch]);

  const matrixOrder = useMemo(
    () => normalizeMatrixOrder(dataset?.metadata.matrixOrder),
    [dataset],
  );

  const atlasOrder = useMemo(() => {
    if (matrixOrder.length === 0) return [];
    if (!atlasDefinition?.rois?.length) return matrixOrder;
    const roiById = new Map(
      atlasDefinition.rois.map((roi) => [String(roi.id), roi]),
    );
    return matrixOrder.map((entry) => {
      const roi = roiById.get(entry.id);
      if (!roi) return entry;
      return {
        ...entry,
        label: roi.name ?? entry.label,
        acronym: roi.label ?? entry.label,
      };
    });
  }, [matrixOrder, atlasDefinition]);

  useEffect(() => {
    if (atlasOrder.length === 0) return;
    dispatch(setAtlasLabels(buildAtlasState(atlasOrder, atlas)));
    // Intentionally omit `atlas` so toggling labels does not reinitialize atlas state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlasOrder, dispatch]);

  useEffect(() => {
    const shape = dataset?.metadata.matrixShape;
    if (shape) {
      dispatch(setMatrixShape(shape));
    }
  }, [dataset?.metadata.matrixShape, dispatch]);

  return (
    <Layout className="app-shell">
      <Layout.Content className="app-content">
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          <div>
            <Typography.Title level={2} style={{ marginTop: 8 }}>
              VAFCA · Visual Analytics for Functional Connectivity Assesments
            </Typography.Title>
          </div>

          <Card variant="outlined">
            <Tabs
              destroyOnHidden={true}
              items={[
                {
                  key: "dataset",
                  label: "Management",
                  children: <DatasetManagement />,
                },
                /*                 {
                  key: "matrices",
                  label: "Matrix Views",
                  children: <MatrixSelector />,
                }, */
                {
                  key: "network",
                  label: "Network Visualization",
                  children: <NetworkVisualizationTab />,
                },
                /*                 {
                  key: "circular",
                  label: "Circular Views",
                  children: <CircularSelector />,
                },
                {
                  key: "classic",
                  label: "Node-Link Views",
                  children: <NodeLinkSelector />,
                }, */
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
