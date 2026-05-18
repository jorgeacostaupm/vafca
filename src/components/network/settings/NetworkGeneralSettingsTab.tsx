import { Form, Space, Switch, Typography } from "antd";
import NetworkRangeControls from "@/components/network/NetworkRangeControls";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  patchNetworkControls,
  selectNetworkControls,
  setNetworkHideIsolatedNodes,
} from "@/store/slices/networkVisualization";

export default function NetworkGeneralSettingsTab() {
  const dispatch = useAppDispatch();
  const networkControls = useAppSelector(selectNetworkControls);

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Typography.Text strong>Range</Typography.Text>
        <NetworkRangeControls />
      </Space>

      <Form layout="vertical" style={{ marginBottom: 0 }}>
        <Form.Item label="Coordinated zoom">
          <Switch
            checked={networkControls.syncZoom}
            onChange={(value) =>
              dispatch(
                patchNetworkControls({
                  syncZoom: value,
                }),
              )
            }
          />
        </Form.Item>
        <Form.Item label="Hide isolated nodes" style={{ marginBottom: 0 }}>
          <Switch
            checked={networkControls.hideIsolatedNodes}
            onChange={(value) =>
              dispatch(
                setNetworkHideIsolatedNodes({
                  value,
                }),
              )
            }
          />
        </Form.Item>
      </Form>
    </Space>
  );
}
