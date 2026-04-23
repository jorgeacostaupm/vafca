import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Form, Space, Switch, Typography } from "antd";
import {
  patchNetworkControls,
  setNetworkHideIsolatedNodes,
} from "@/store/slices/networkVisualization";

export default function NetworkManagementControls() {
  const dispatch = useAppDispatch();
  const networkControls = useAppSelector(
    (state) => state.networkVisualization.controls,
  );

  return (
    <Space
      direction="vertical"
      size={8}
      style={{ width: "100%", marginBottom: 8 }}
    >
      <Typography.Text strong>Management</Typography.Text>
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
